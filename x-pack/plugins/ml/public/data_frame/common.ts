/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React from 'react';

import { DefaultOperator } from 'elasticsearch';

import { StaticIndexPattern } from 'ui/index_patterns';

import { Dictionary } from 'x-pack/plugins/ml/common/types/common';

import { DefinePivotExposedState } from './components/define_pivot/define_pivot_form';

// The display label used for an aggregation e.g. sum(bytes).
export type Label = string;

// Label object structured for EUI's ComboBox.
export interface DropDownLabel {
  label: Label;
}

// Label object structure for EUI's ComboBox with support for nesting.
export interface DropDownOption {
  label: Label;
  options: DropDownLabel[];
}

// The internal representation of an aggregation definition.
type aggName = string;
type fieldName = string;
export interface OptionsDataElement {
  agg: PivotAggSupportedAggs;
  field: fieldName;
  formRowLabel: aggName;
}

export type OptionsDataElementDict = Dictionary<OptionsDataElement>;

export interface SimpleQuery {
  query: {
    query_string: {
      query: string;
      default_operator: DefaultOperator;
    };
  };
}

// DataFramePreviewRequest
type PivotGroupBySupportedAggs = 'terms';
type PivotGroupBy = {
  [key in PivotGroupBySupportedAggs]: {
    field: string;
  }
};
type PivotGroupByDict = Dictionary<PivotGroupBy>;

type PivotAggSupportedAggs = 'avg' | 'cardinality' | 'max' | 'min' | 'sum' | 'value_count';
type PivotAgg = {
  [key in PivotAggSupportedAggs]?: {
    field: fieldName;
  }
};
type PivotAggDict = { [key in aggName]: PivotAgg };

export interface DataFramePreviewRequest {
  pivot: {
    group_by: PivotGroupByDict;
    aggregations: PivotAggDict;
  };
  query?: any;
  source: string;
}

export interface DataFrameRequest extends DataFramePreviewRequest {
  dest: string;
}

export const pivotSupportedAggs = [
  'avg',
  'cardinality',
  'max',
  'min',
  'sum',
  'value_count',
] as PivotAggSupportedAggs[];

export function getPivotQuery(search: string) {
  return {
    query: {
      query_string: {
        query: search,
        default_operator: 'AND',
      },
    },
  } as SimpleQuery;
}
export function getDataFramePreviewRequest(
  indexPatternTitle: StaticIndexPattern['title'],
  query: SimpleQuery['query'],
  groupBy: string[],
  aggs: OptionsDataElement[]
) {
  const request: DataFramePreviewRequest = {
    source: indexPatternTitle,
    pivot: {
      group_by: {},
      aggregations: {},
    },
    query,
  };

  groupBy.forEach(g => {
    request.pivot.group_by[g] = {
      terms: {
        field: g,
      },
    };
  });

  aggs.forEach(agg => {
    request.pivot.aggregations[agg.formRowLabel] = {
      [agg.agg]: {
        field: agg.field,
      },
    };
  });

  return request;
}

export function getDataFrameRequest(
  indexPatternTitle: StaticIndexPattern['title'],
  pivotState: DefinePivotExposedState,
  jobDetailsState: any
) {
  const request: DataFrameRequest = {
    ...getDataFramePreviewRequest(
      indexPatternTitle,
      getPivotQuery(pivotState.search).query,
      pivotState.groupBy,
      pivotState.aggs
    ),
    dest: jobDetailsState.targetIndex,
  };

  return request;
}

export type IndexPatternContextValue = StaticIndexPattern | null;
export const IndexPatternContext = React.createContext(null as IndexPatternContextValue);
