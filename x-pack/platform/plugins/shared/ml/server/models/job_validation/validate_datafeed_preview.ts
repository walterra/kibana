/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { CombinedJob } from '@kbn/ml-common-types/anomaly_detection_jobs/combined_job';
import type { JobValidationMessage } from '@kbn/ml-common-constants/messages';
import type { DatafeedValidationResponse } from '@kbn/ml-common-types/job_validation';
import type { AuthorizationHeader } from '../../lib/request_authorization';
import type { MlClient } from '../../lib/ml_client';

export async function validateDatafeedPreviewWithMessages(
  mlClient: MlClient,
  authHeader: AuthorizationHeader,
  job: CombinedJob,
  start: number | undefined,
  end: number | undefined
): Promise<JobValidationMessage[]> {
  const { valid, documentsFound } = await validateDatafeedPreview(
    mlClient,
    authHeader,
    job,
    start,
    end
  );
  if (valid) {
    return documentsFound ? [] : [{ id: 'datafeed_preview_no_documents' }];
  }
  return [{ id: 'datafeed_preview_failed' }];
}

export async function validateDatafeedPreview(
  mlClient: MlClient,
  authHeader: AuthorizationHeader,
  job: CombinedJob,
  start: number | undefined,
  end: number | undefined
): Promise<DatafeedValidationResponse> {
  const { datafeed_config: datafeed, ...tempJob } = job;
  try {
    const body = (await mlClient.previewDatafeed(
      {
        body: {
          job_config: tempJob,
          datafeed_config: datafeed,
        },
        start,
        end,
      },
      { ...authHeader, maxRetries: 0 }
      // previewDatafeed response type is incorrect
    )) as unknown as { body: unknown[] };

    return {
      valid: true,
      documentsFound: Array.isArray(body) && body.length > 0,
    };
  } catch (error) {
    return {
      valid: false,
      documentsFound: false,
      error: error.body ?? error,
    };
  }
}
