/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { TypeOf } from '@kbn/config-schema';
import { schema } from '@kbn/config-schema';

export const aiopsLogRateAnalysisSchema = schema.object({
  index: schema.string(),
  start: schema.string(),
  end: schema.string(),
  timefield: schema.string(),
});

export type AiopsLogRateAnalysisSchema = TypeOf<typeof aiopsLogRateAnalysisSchema>;
