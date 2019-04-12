/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { i18n } from '@kbn/i18n';
import { toastNotifications } from 'ui/notify';
import { ml } from '../../../../../../services/ml_api_service';
import { Dictionary } from '../../../../../../../common/types/common';
import { DataFrameJob, DataFrameJobListRow } from '../common';

type jobId = string;

interface DataFrameJobStats {
  id: jobId;
  state: Dictionary<any>;
  stats: Dictionary<any>;
}

interface GetDataFrameTransformsResponse {
  count: number;
  transforms: DataFrameJob[];
}

interface GetDataFrameTransformsStatsResponse {
  count: number;
  transforms: DataFrameJobStats[];
}

export const getJobsFactory = (
  setDataFrameJobs: React.Dispatch<React.SetStateAction<DataFrameJobListRow[]>>
) => async () => {
  try {
    const jobConfigs: GetDataFrameTransformsResponse = await ml.dataFrame.getDataFrameTransforms();
    const jobStats: GetDataFrameTransformsStatsResponse = await ml.dataFrame.getDataFrameTransformsStats();

    const tableRows = jobConfigs.transforms.map(config => {
      const stats = jobStats.transforms.find(d => config.id === d.id);

      if (stats === undefined) {
        return { config, state: {}, stats: {} };
      }

      return { config, state: stats.state, stats: stats.stats };
    });

    setDataFrameJobs(tableRows);
  } catch (e) {
    toastNotifications.addDanger(
      i18n.translate('xpack.ml.dataframe.jobsList.errorGettingDataFrameJobsList', {
        defaultMessage: 'An error occurred getting the data frame jobs list: {error}',
        values: { error: JSON.stringify(e) },
      })
    );
  }
};
