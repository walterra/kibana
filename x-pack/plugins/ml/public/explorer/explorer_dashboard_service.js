/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */



/*
 * Service for firing and registering for events across the different
 * components in the Explorer dashboard.
 */

import { uiModules } from 'ui/modules';
const module = uiModules.get('apps/ml');

import { listenerFactoryProvider } from 'plugins/ml/factories/listener_factory';

module.service('mlExplorerDashboardService', function () {
  const listenerFactory = listenerFactoryProvider();
  const swimlaneCellClick = this.swimlaneCellClick = listenerFactory();
  const swimlaneDataChange = this.swimlaneDataChange = listenerFactory();
  const swimlaneRenderDone = this.swimlaneRenderDone = listenerFactory();

  this.init = function () {
    // Clear out any old listeners.
    swimlaneCellClick.unwatchAll();
    swimlaneDataChange.unwatchAll();
    swimlaneRenderDone.unwatchAll();
  };

});
