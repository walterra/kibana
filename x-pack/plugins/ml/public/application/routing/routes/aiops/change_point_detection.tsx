/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { CHANGE_POINT_DETECTION_ENABLED } from '@kbn/aiops-change-point-detection/constants';
import { i18n } from '@kbn/i18n';
import type { FC } from 'react';
import React from 'react';
import { dynamic } from '@kbn/shared-ux-utility';
import { ML_PAGES } from '@kbn/ml-locator';
import { DataSourceContextProvider } from '../../../contexts/ml';
import type { NavigateToPath } from '../../../contexts/kibana';
import type { MlRoute } from '../..';
import { getBreadcrumbWithUrlForApp } from '../../breadcrumbs';
import { createPath, PageLoader } from '../../router';
import { useRouteResolver } from '../../use_resolver';

const Page = dynamic(async () => ({
  default: (await import('../../../aiops')).ChangePointDetectionPage,
}));

export const changePointDetectionRouteFactory = (
  navigateToPath: NavigateToPath,
  basePath: string
): MlRoute => ({
  id: 'change_point_detection',
  path: createPath(ML_PAGES.AIOPS_CHANGE_POINT_DETECTION),
  title: i18n.translate('xpack.ml.aiops.changePointDetection.docTitle', {
    defaultMessage: 'Change point detection',
  }),
  render: () => <PageWrapper />,
  breadcrumbs: [
    getBreadcrumbWithUrlForApp('ML_BREADCRUMB', navigateToPath, basePath),
    getBreadcrumbWithUrlForApp('AIOPS_BREADCRUMB_CHANGE_POINT_DETECTION', navigateToPath, basePath),
    {
      text: i18n.translate('xpack.ml.aiopsBreadcrumbs.changePointDetectionLabel', {
        defaultMessage: 'Change point detection',
      }),
    },
  ],
  disabled: !CHANGE_POINT_DETECTION_ENABLED,
});

const PageWrapper: FC = () => {
  const { context } = useRouteResolver('full', ['canUseAiops']);

  return (
    <PageLoader context={context}>
      <DataSourceContextProvider>
        <Page />
      </DataSourceContextProvider>
    </PageLoader>
  );
};
