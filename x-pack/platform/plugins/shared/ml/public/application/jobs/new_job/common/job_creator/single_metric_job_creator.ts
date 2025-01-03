/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { DataView } from '@kbn/data-views-plugin/public';
import type { Aggregation, AggFieldPair, Field } from '@kbn/ml-anomaly-utils';
import { DOC_COUNT } from '@kbn/ml-anomaly-utils/field_types';
import { ES_AGGREGATION } from '@kbn/ml-anomaly-utils/es_aggregation';
import { ML_JOB_AGGREGATION } from '@kbn/ml-anomaly-utils/aggregation_types';
import type { SavedSearch } from '@kbn/saved-search-plugin/public';
import { parseInterval } from '@kbn/ml-parse-interval';

import type { Job, Detector, BucketSpan } from '@kbn/ml-common-types/anomaly_detection_jobs/job';
import type { Datafeed } from '@kbn/ml-common-types/anomaly_detection_jobs/datafeed';
import { JOB_TYPE, CREATED_BY_LABEL } from '@kbn/ml-common-constants/new_job';
import type { MlApi } from '../../../../services/ml_api_service';
import { JobCreator } from './job_creator';
import { createBasicDetector } from './util/default_configs';
import { getRichDetectors } from './util/general';
import { isSparseDataJob } from './util/general';
import type { NewJobCapsService } from '../../../../services/new_job_capabilities/new_job_capabilities_service';

export class SingleMetricJobCreator extends JobCreator {
  protected _type: JOB_TYPE = JOB_TYPE.SINGLE_METRIC;

  constructor(
    mlApi: MlApi,
    newJobCapsService: NewJobCapsService,
    indexPattern: DataView,
    savedSearch: SavedSearch | null,
    query: object
  ) {
    super(mlApi, newJobCapsService, indexPattern, savedSearch, query);
    this.createdBy = CREATED_BY_LABEL.SINGLE_METRIC;
    this._wizardInitialized$.next(true);
  }

  // only a single detector exists for this job type
  // therefore _addDetector and _editDetector merge into this
  // single setDetector function
  public setDetector(agg: Aggregation, field: Field) {
    const dtr: Detector = createBasicDetector(agg, field);

    if (this._detectors.length === 0) {
      this._addDetector(dtr, agg, field);
    } else {
      this._editDetector(dtr, agg, field, 0);
    }

    this._createDatafeedAggregations();
  }

  public set bucketSpan(bucketSpan: BucketSpan) {
    this._job_config.analysis_config.bucket_span = bucketSpan;
    this._setBucketSpanMs(bucketSpan);
    this._createDatafeedAggregations();
  }

  // overriding set means we need to override get too
  // JS doesn't do inheritance very well
  public get bucketSpan(): BucketSpan {
    return this._job_config.analysis_config.bucket_span!;
  }

  // aggregations need to be recreated whenever the detector or bucket_span change
  private _createDatafeedAggregations() {
    if (
      this._detectors.length &&
      typeof this._job_config.analysis_config.bucket_span === 'string' &&
      this._aggs.length > 0
    ) {
      delete this._job_config.analysis_config.summary_count_field_name;
      delete this._datafeed_config.aggregations;

      // if the selected field is called doc_count, we cannot use aggregations
      if (this._fields[0]?.name === DOC_COUNT) {
        return;
      }

      const functionName = this._aggs[0].dslName;
      const timeField = this._job_config.data_description.time_field!;

      const duration = parseInterval(this._job_config.analysis_config.bucket_span, true);
      if (duration === null) {
        return;
      }

      const bucketSpanSeconds = duration.asSeconds();
      const interval = bucketSpanSeconds * 1000;

      let field = null;

      switch (functionName) {
        case ES_AGGREGATION.COUNT:
          this._job_config.analysis_config.summary_count_field_name = DOC_COUNT;

          this._datafeed_config.aggregations = {
            buckets: {
              date_histogram: {
                field: timeField,
                fixed_interval: `${interval}ms`,
              },
              aggregations: {
                [timeField]: {
                  max: {
                    field: timeField,
                  },
                },
              },
            },
          };
          break;
        case ES_AGGREGATION.AVG:
        // TODO - fix median aggregations
        // case ES_AGGREGATION.PERCENTILES:
        case ES_AGGREGATION.SUM:
        case ES_AGGREGATION.MIN:
        case ES_AGGREGATION.MAX:
          field = this._fields[0];
          if (field !== null) {
            const fieldName = field.name;
            this._job_config.analysis_config.summary_count_field_name = DOC_COUNT;

            this._datafeed_config.aggregations = {
              buckets: {
                date_histogram: {
                  field: timeField,
                  fixed_interval: `${interval * 0.1}ms`, // use 10% of bucketSpan to allow for better sampling
                },
                aggregations: {
                  [fieldName]: {
                    [functionName]: {
                      field: fieldName,
                    },
                  },
                  [timeField]: {
                    max: {
                      field: timeField,
                    },
                  },
                },
              },
            };
          }
          break;
        case ES_AGGREGATION.CARDINALITY:
          field = this._fields[0];
          if (field !== null) {
            const fieldName = field.name;

            this._job_config.analysis_config.summary_count_field_name = `dc_${fieldName}`;

            this._datafeed_config.aggregations = {
              buckets: {
                date_histogram: {
                  field: timeField,
                  fixed_interval: `${interval}ms`,
                },
                aggregations: {
                  [timeField]: {
                    max: {
                      field: timeField,
                    },
                  },
                  [this._job_config.analysis_config.summary_count_field_name]: {
                    [functionName]: {
                      field: fieldName,
                    },
                  },
                },
              },
            };

            const dtr = this._detectors[0];
            // finally, modify the detector before saving
            dtr.function = ML_JOB_AGGREGATION.NON_ZERO_COUNT;
            // add a description using the original function name rather 'non_zero_count'
            // as the user may not be aware it's been changed
            dtr.detector_description = `${functionName} (${fieldName})`;
            delete dtr.field_name;
          }
          break;
        default:
          break;
      }
    }
  }

  public get aggFieldPair(): AggFieldPair | null {
    if (this._aggs.length === 0) {
      return null;
    } else {
      return {
        agg: this._aggs[0],
        field: this._fields[0],
      };
    }
  }

  public cloneFromExistingJob(job: Job, datafeed: Datafeed) {
    this._overrideConfigs(job, datafeed);
    this.createdBy = CREATED_BY_LABEL.SINGLE_METRIC;
    this._sparseData = isSparseDataJob(job, datafeed);
    const detectors = getRichDetectors(
      this.newJobCapsService,
      job,
      datafeed,
      this.additionalFields,
      false
    );

    this.removeAllDetectors();

    const dtr = detectors[0];
    if (detectors.length && dtr.agg !== null && dtr.field !== null) {
      this.setDetector(dtr.agg, dtr.field);
    }
  }
}
