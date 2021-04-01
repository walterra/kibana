/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useMemo, useEffect, FC } from 'react';

// import type { TopLevelSpec } from 'vega-lite';
// import { compile } from 'vega-lite';
// import { parse, View, Warn } from 'vega';
// import { Handler } from 'vega-tooltip';

import { htmlIdGenerator } from '@elastic/eui';

import type { TopLevelSpec } from '../../../../../../../src/plugins/vis_type_vega/public';
import { mlDraftExport } from '../../../../../../../src/plugins/vis_type_vega/public';
const { compile, parse, View, Warn, Handler } = mlDraftExport;

export interface VegaChartViewProps {
  vegaSpec: TopLevelSpec;
}

export const VegaChartView: FC<VegaChartViewProps> = ({ vegaSpec }) => {
  const htmlId = useMemo(() => htmlIdGenerator()(), []);

  useEffect(() => {
    const vgSpec = compile(vegaSpec).spec;

    const view = new View(parse(vgSpec))
      .logLevel(Warn)
      .renderer('canvas')
      .tooltip(new Handler().call)
      .initialize(`#${htmlId}`);

    view.runAsync(); // evaluate and render the view
  }, [vegaSpec]);

  return <div id={htmlId} className="mlVegaChart" data-test-subj="mlVegaChart" />;
};

// required for dynamic import using React.lazy()
// eslint-disable-next-line import/no-default-export
export default VegaChartView;
