/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

// Be careful adding exports to this file, it may increase the bundle size of
// the ML plugin's page load bundle. You should either just export types or
// use `getMlSharedImports()` to export static code.

import type { PluginInitializer, PluginInitializerContext } from '@kbn/core/public';
import type {
  MlPluginSetup,
  MlPluginStart,
  MlSetupDependencies,
  MlStartDependencies,
} from './plugin';
import { MlPlugin } from './plugin';

export const plugin: PluginInitializer<
  MlPluginSetup,
  MlPluginStart,
  MlSetupDependencies,
  MlStartDependencies
> = (initializerContext: PluginInitializerContext) => new MlPlugin(initializerContext);

export type { MlPluginSetup, MlPluginStart };

export type {
  AnomalySwimLaneEmbeddableApi,
  AnomalySwimLaneEmbeddableState,
} from './embeddables/types';

// export type { MlLocator } from './locator/ml_locator';
// export { MlLocatorDefinition } from './locator/ml_locator';
// export { useMlHref } from './locator/use_ml_href';

// export { MlNodeAvailableWarningShared } from './application/components/node_available_warning';
