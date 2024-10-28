/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { MlCapabilitiesResponse } from '@kbn/ml-common-types/capabilities';
import type { MlApi } from '../services/ml_api_service';

export function getCapabilities(mlApi: MlApi): Promise<MlCapabilitiesResponse> {
  return mlApi.checkMlCapabilities();
}
