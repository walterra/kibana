/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

// @ts-ignore
import { checkFullLicense } from '../../../license/check_license';
// @ts-ignore
import { checkGetJobsPrivilege } from '../../../privilege/check_privilege';
// @ts-ignore
import { loadCurrentIndexPattern } from '../../../util/index_utils';
// @ts-ignore
import { getDataFrameCreateBreadcrumbs } from '../../breadcrumbs';

import uiRoutes from 'ui/routes';

const template = `<ml-nav-menu name="new_data_frame" /><ml-new-data-frame />`;

uiRoutes.when('/data_frame/new_job/step/pivot?', {
  template,
  k7Breadcrumbs: getDataFrameCreateBreadcrumbs,
  resolve: {
    CheckLicense: checkFullLicense,
    privileges: checkGetJobsPrivilege,
    indexPattern: loadCurrentIndexPattern,
  },
});
