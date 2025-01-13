/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/*
 * NOTICE: Do not edit this file manually.
 * This file is automatically generated by the OpenAPI Generator, @kbn/openapi-generator.
 *
 * info:
 *   title: Response Schemas.
 *   version: not applicable
 */

import { z } from '@kbn/zod';

import { Mapping, Pipeline, Docs, SamplesFormat } from './common_attributes.gen';
import { ESProcessorItem } from './processor_attributes.gen';
import { GeneratedCelDetails } from './cel_input_attributes.gen';

export type EcsMappingAPIResponse = z.infer<typeof EcsMappingAPIResponse>;
export const EcsMappingAPIResponse = z.object({
  results: z.object({
    mapping: Mapping,
    pipeline: Pipeline,
  }),
});

export type CategorizationAPIResponse = z.infer<typeof CategorizationAPIResponse>;
export const CategorizationAPIResponse = z.object({
  results: z.object({
    docs: Docs,
    pipeline: Pipeline,
  }),
});

export type RelatedAPIResponse = z.infer<typeof RelatedAPIResponse>;
export const RelatedAPIResponse = z.object({
  results: z.object({
    docs: Docs,
    pipeline: Pipeline,
  }),
});

export type CheckPipelineAPIResponse = z.infer<typeof CheckPipelineAPIResponse>;
export const CheckPipelineAPIResponse = z.object({
  results: z.object({
    docs: Docs,
  }),
});

export type AnalyzeLogsAPIResponse = z.infer<typeof AnalyzeLogsAPIResponse>;
export const AnalyzeLogsAPIResponse = z.object({
  additionalProcessors: z.array(ESProcessorItem).optional(),
  results: z.object({
    samplesFormat: SamplesFormat,
    parsedSamples: z.array(z.string()),
  }),
});

export type CelInputAPIResponse = z.infer<typeof CelInputAPIResponse>;
export const CelInputAPIResponse = z.object({
  results: GeneratedCelDetails,
});

export type AnalyzeApiAPIResponse = z.infer<typeof AnalyzeApiAPIResponse>;
export const AnalyzeApiAPIResponse = z.object({
  results: z.object({
    suggestedPaths: z.array(z.string()),
  }),
});
