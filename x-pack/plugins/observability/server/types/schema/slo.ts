/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import * as t from 'io-ts';

import { indicatorSchema } from './indicators';

const rollingTimeWindowSchema = t.type({
  duration: t.string,
  is_rolling: t.literal(true),
});

const budgetingMethodSchema = t.literal('occurrences');

const objectiveSchema = t.type({
  target: t.number,
});

const commonSLOSchema = t.type({
  name: t.string,
  description: t.string,
  indicator: indicatorSchema,
  time_window: rollingTimeWindowSchema,
  budgeting_method: budgetingMethodSchema,
  objective: objectiveSchema,
});

export { commonSLOSchema, rollingTimeWindowSchema, budgetingMethodSchema, objectiveSchema };
