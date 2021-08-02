/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { ElasticsearchClient } from 'src/core/server';

import type { estypes } from '@elastic/elasticsearch';

import type { SearchServiceFetchParams } from '../../../../../common/search_strategies/correlations/types';

import type { AsyncSearchServiceState } from '../async_search_service_state';
import { TERMS_SIZE } from '../constants';

import { getQueryWithParams } from './get_query_with_params';
import { getRequestBase } from './get_request_base';

interface FieldValuePair {
  field: string;
  value: string;
}
export type FieldValuePairs = FieldValuePair[];

export type Field = string;

export const getTermsAggRequest = (
  params: SearchServiceFetchParams,
  fieldName: string
): estypes.SearchRequest => ({
  ...getRequestBase(params),
  body: {
    query: getQueryWithParams({ params }),
    size: 0,
    aggs: {
      attribute_terms: {
        terms: {
          field: fieldName,
          size: TERMS_SIZE,
        },
      },
    },
  },
});

export const fetchTransactionDurationFieldValuePairs = async (
  esClient: ElasticsearchClient,
  params: SearchServiceFetchParams,
  fieldCandidates: Field[],
  state: AsyncSearchServiceState
): Promise<FieldValuePairs> => {
  const fieldValuePairs: FieldValuePairs = [];

  let fieldValuePairsProgress = 1;

  for (let i = 0; i < fieldCandidates.length; i++) {
    const fieldName = fieldCandidates[i];
    state.setProgress({
      loadedFieldValuePairs: fieldValuePairsProgress / fieldCandidates.length,
    });

    try {
      const resp = await esClient.search(getTermsAggRequest(params, fieldName));

      if (resp.body.aggregations === undefined) {
        fieldValuePairsProgress++;
        continue;
      }
      const buckets = (resp.body.aggregations
        .attribute_terms as estypes.AggregationsMultiBucketAggregate<{
        key: string;
      }>)?.buckets;
      if (buckets.length >= 0) {
        fieldValuePairs.push(
          ...buckets.map((d) => ({
            field: fieldName,
            value: d.key,
          }))
        );
      }

      fieldValuePairsProgress++;
    } catch (e) {
      fieldValuePairsProgress++;
    }
  }
  return fieldValuePairs;
};
