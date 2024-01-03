/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { isEqual } from 'lodash';

import type { DataView } from '@kbn/data-views-plugin/common';

import { Dictionary } from '../../../../../../../common/types/common';
import { PivotSupportedAggs } from '../../../../../../../common/types/pivot_aggs';
import {
  isLatestTransform,
  isPivotTransform,
  TransformBaseConfig,
} from '../../../../../../../common/types/transform';

import {
  matchAllQuery,
  PivotAggsConfig,
  PivotAggsConfigDict,
  PivotGroupByConfig,
  PivotGroupByConfigDict,
  PIVOT_SUPPORTED_GROUP_BY_AGGS,
} from '../../../../../common';

import { StepDefineState } from './types';
import { getAggConfigFromEsAgg } from '../../../../../common/pivot_aggs';
import { TRANSFORM_FUNCTION } from '../../../../../../../common/constants';
import { validateLatestConfig } from '../hooks/use_latest_function_config';
import { validatePivotConfig } from '../hooks/use_pivot_config';

export function applyTransformConfigToDefineState(
  state: StepDefineState,
  transformConfig?: TransformBaseConfig,
  dataView?: DataView
): StepDefineState {
  if (transformConfig === undefined) {
    return state;
  }

  if (isPivotTransform(transformConfig)) {
    state.transformFunction = TRANSFORM_FUNCTION.PIVOT;

    // apply the transform configuration to wizard DEFINE state
    // transform aggregations config to wizard state
    state.aggList = Object.keys(transformConfig.pivot.aggregations).reduce((aggList, aggName) => {
      const aggConfig = transformConfig.pivot.aggregations[
        aggName as PivotSupportedAggs
      ] as Dictionary<any>;
      aggList[aggName] = getAggConfigFromEsAgg(aggConfig, aggName) as PivotAggsConfig;
      return aggList;
    }, {} as PivotAggsConfigDict);

    // transform group by config to wizard state
    state.groupByList = Object.keys(transformConfig.pivot.group_by).reduce(
      (groupByList, groupByName) => {
        const groupByConfig = transformConfig.pivot.group_by[groupByName] as Dictionary<any>;
        const groupBy = Object.keys(groupByConfig)[0];
        groupByList[groupByName] = {
          agg: groupBy as PIVOT_SUPPORTED_GROUP_BY_AGGS,
          aggName: groupByName,
          dropDownName: groupByName,
          ...groupByConfig[groupBy],
        } as PivotGroupByConfig;
        return groupByList;
      },
      {} as PivotGroupByConfigDict
    );

    state.validationStatus = validatePivotConfig(transformConfig.pivot);
  }

  if (isLatestTransform(transformConfig)) {
    state.transformFunction = TRANSFORM_FUNCTION.LATEST;
    state.latestConfig = {
      unique_key: transformConfig.latest.unique_key.map((v) => ({
        value: v,
        label: dataView ? dataView.fields.find((f) => f.name === v)?.displayName ?? v : v,
      })),
      sort: {
        value: transformConfig.latest.sort,
        label: dataView
          ? dataView.fields.find((f) => f.name === transformConfig.latest.sort)?.displayName ??
            transformConfig.latest.sort
          : transformConfig.latest.sort,
      },
    };
    state.validationStatus = validateLatestConfig(transformConfig.latest);
  }

  // only apply the query from the transform config to wizard state if it's not the default query
  const query = transformConfig.source.query;
  if (query !== undefined && !isEqual(query, matchAllQuery)) {
    state.searchQuery = query;
  }

  return state;
}
