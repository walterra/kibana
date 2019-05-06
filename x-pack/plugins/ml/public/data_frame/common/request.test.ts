/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { PivotGroupByConfig } from '../common';

import { JobDetailsExposedState } from '../components/job_details/job_details_form';
import { DefinePivotExposedState } from '../components/define_pivot/define_pivot_form';

import { PIVOT_SUPPORTED_GROUP_BY_AGGS } from './pivot_group_by';
import { PivotAggsConfig, PIVOT_SUPPORTED_AGGS } from './pivot_aggs';
import { getDataFramePreviewRequest, getDataFrameRequest, getPivotQuery } from './request';

describe('Data Frame: Common', () => {
  test('getPivotQuery()', () => {
    const query = getPivotQuery('the-query');

    expect(query).toEqual({
      query_string: {
        query: 'the-query',
        default_operator: 'AND',
      },
    });
  });

  test('getDataFramePreviewRequest()', () => {
    const query = getPivotQuery('the-query');
    const groupBy: PivotGroupByConfig[] = [
      {
        agg: PIVOT_SUPPORTED_GROUP_BY_AGGS.TERMS,
        field: 'the-group-by-field',
        aggName: 'the-group-by-label',
      },
    ];
    const aggs: PivotAggsConfig[] = [
      { agg: PIVOT_SUPPORTED_AGGS.AVG, field: 'the-agg-field', aggName: 'the-agg-label' },
      {
        agg: PIVOT_SUPPORTED_AGGS.TRANSACTION_DURATION,
        field: 'the-transaction-field',
        aggName: 'the-transaction-label',
      },
    ];
    const request = getDataFramePreviewRequest('the-index-pattern-title', query, groupBy, aggs);

    expect(request).toEqual({
      pivot: {
        aggregations: {
          'the-agg-label': { avg: { field: 'the-agg-field' } },
          'the-transaction-label': {
            scripted_metric: {
              init_script: 'state.timestamps = []',
              map_script: `state.timestamps.add(doc['the-transaction-field'].value.getMillis())`,
              combine_script: `
state.min = Double.POSITIVE_INFINITY;
state.max = Double.NEGATIVE_INFINITY;
for (timestamp in state.timestamps) {
  state.min = Math.min(state.min, timestamp);
  state.max = Math.max(state.max, timestamp);
}
return state;
`,
              reduce_script: `
double min = Double.POSITIVE_INFINITY;
double max = Double.NEGATIVE_INFINITY;
for (s in states) {
  min = Math.min(min, s.min);
  max = Math.max(max, s.max);
}
return max - min;
`,
            },
          },
        },
        group_by: { 'the-group-by-label': { terms: { field: 'the-group-by-field' } } },
      },
      source: {
        index: 'the-index-pattern-title',
        query: { query_string: { default_operator: 'AND', query: 'the-query' } },
      },
    });
  });

  test('getDataFrameRequest()', () => {
    const groupBy: PivotGroupByConfig = {
      agg: PIVOT_SUPPORTED_GROUP_BY_AGGS.TERMS,
      field: 'the-group-by-field',
      aggName: 'the-group-by-label',
    };
    const agg: PivotAggsConfig = {
      agg: PIVOT_SUPPORTED_AGGS.AVG,
      field: 'the-agg-field',
      aggName: 'the-agg-label',
    };
    const pivotState: DefinePivotExposedState = {
      aggList: { 'the-agg-name': agg },
      groupByList: { 'the-group-by-name': groupBy },
      search: 'the-query',
      valid: true,
    };
    const jobDetailsState: JobDetailsExposedState = {
      jobId: 'the-job-id',
      targetIndex: 'the-target-index',
      touched: true,
      valid: true,
    };

    const request = getDataFrameRequest('the-index-pattern-title', pivotState, jobDetailsState);

    expect(request).toEqual({
      dest: { index: 'the-target-index' },
      pivot: {
        aggregations: { 'the-agg-label': { avg: { field: 'the-agg-field' } } },
        group_by: { 'the-group-by-label': { terms: { field: 'the-group-by-field' } } },
      },
      source: {
        index: 'the-index-pattern-title',
        query: { query_string: { default_operator: 'AND', query: 'the-query' } },
      },
    });
  });
});
