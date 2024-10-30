/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { type HttpStart } from '@kbn/core-http-browser';
import { HttpService } from './http_service';

export type MlSharedServices = ReturnType<typeof getMlSharedServices>;

/**
 * Provides ML services exposed from the plugin start.
 */
export async function getMlSharedServices(httpStart: HttpStart) {
  const httpService = new HttpService(httpStart);
  const { mlApiProvider } = await import('./ml_api_service');
  return mlApiProvider(httpService);
}
