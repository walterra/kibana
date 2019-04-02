/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */



import chrome from 'ui/chrome';

import { http } from '../../services/http_service';

const basePath = chrome.addBasePath('/api/ml');

export const dataFrame = {
  createDataFrameTransformsJob(jobId, jobConfig) {
    return http({
      url: `${basePath}/_data_frame/transforms/${jobId}`,
      method: 'PUT',
      data: jobConfig
    });
  },
  getDataFrameTransformsPreview(obj) {
    return http({
      url: `${basePath}/_data_frame/transforms/_preview`,
      method: 'POST',
      data: obj
    });
  },
  startDataFrameTransformsJob(jobId) {
    return http({
      url: `${basePath}/_data_frame/transforms/${jobId}/_start`,
      method: 'POST',
    });
  },
};
