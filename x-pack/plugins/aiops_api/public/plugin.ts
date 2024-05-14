/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { Plugin } from '@kbn/core/public';
import { type CoreSetup } from '@kbn/core/public';
import { firstValueFrom } from 'rxjs';
import type {
  AiopsApiPluginSetup,
  AiopsApiPluginSetupDeps,
  AiopsApiPluginStart,
  AiopsApiPluginStartDeps,
} from './types';

export type AiopsCoreSetup = CoreSetup<AiopsApiPluginStartDeps, AiopsApiPluginStart>;

export class AiopsApiPlugin
  implements
    Plugin<
      AiopsApiPluginSetup,
      AiopsApiPluginStart,
      AiopsApiPluginSetupDeps,
      AiopsApiPluginStartDeps
    >
{
  public setup(core: AiopsCoreSetup, { licensing }: AiopsApiPluginSetupDeps) {
    Promise.all([firstValueFrom(licensing.license$), core.getStartServices()]).then(
      ([license, [coreStart, pluginsStart]]) => {
        if (license.hasAtLeast('enterprise')) {
          const service = pluginsStart.observabilityAIAssistant.service;

          service.register(async ({ registerRenderFunction }) => {
            const { registerFunctions } = await import('./functions');

            await registerFunctions({ coreStart, pluginsStart, registerRenderFunction });
          });
        }
      }
    );
  }

  public start() {}
  public stop() {}
}
