/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { RegisterRenderFunctionDefinition } from '@kbn/observability-ai-assistant-plugin/public/types';
import type { AiopsApiPluginStartDeps } from '../types';
import { registerLogRateAnalysisRenderFunction } from './log_rate_analysis';

export async function registerFunctions({
  registerRenderFunction,
  pluginsStart,
}: {
  registerRenderFunction: RegisterRenderFunctionDefinition;
  pluginsStart: AiopsApiPluginStartDeps;
}) {
  registerLogRateAnalysisRenderFunction({ pluginsStart, registerRenderFunction });
}
