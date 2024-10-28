/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { i18n } from '@kbn/i18n';
import type { JobId } from '@kbn/ml-common-types/anomaly_detection_jobs/job';

export const getDefaultExplorerChartsPanelTitle = (jobIds: JobId[]) =>
  i18n.translate('xpack.ml.anomalyChartsEmbeddable.title', {
    defaultMessage: 'ML anomaly charts for {jobIds}',
    values: { jobIds: jobIds.join(', ') },
  });
