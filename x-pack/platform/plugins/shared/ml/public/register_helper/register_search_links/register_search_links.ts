/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { i18n } from '@kbn/i18n';
import type { BehaviorSubject } from 'rxjs';

import type { AppUpdater } from '@kbn/core/public';
import type { MlCapabilities } from '@kbn/ml-common-types/capabilities';
import { getDeepLinks } from './search_deep_links';

export function registerSearchLinks(
  appUpdater: BehaviorSubject<AppUpdater>,
  isFullLicense: boolean,
  mlCapabilities: MlCapabilities,
  isServerless: boolean,
  isEsqlEnabled?: boolean
) {
  appUpdater.next(() => ({
    keywords: [
      i18n.translate('xpack.ml.keyword.ml', {
        defaultMessage: 'ML',
      }),
    ],
    deepLinks: getDeepLinks(isFullLicense, mlCapabilities, isServerless, isEsqlEnabled),
  }));
}
