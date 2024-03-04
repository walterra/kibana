/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { Communities, Edge } from 'jlouvain';

import type { SignificantItem, SignificantItemGroup } from '@kbn/ml-agg-utils';

import { API_ACTION_NAME, AiopsLogRateAnalysisApiAction } from './log_rate_analysis/actions';

interface StreamState {
  ccsWarning: boolean;
  significantItems: SignificantItem[];
  significantItemsGroups: SignificantItemGroup[];
  nodes: string[];
  edges: Edge[];
  jLouvainResult: Communities;
  errors: string[];
  loaded: number;
  loadingState: string;
  remainingFieldCandidates?: string[];
  groupsMissing?: boolean;
  zeroDocsFallback: boolean;
}

export const initialState: StreamState = {
  ccsWarning: false,
  significantItems: [],
  significantItemsGroups: [],
  nodes: [],
  edges: [],
  jLouvainResult: {},
  errors: [],
  loaded: 0,
  loadingState: '',
  zeroDocsFallback: false,
};

export function streamReducer(
  state: StreamState,
  action: AiopsLogRateAnalysisApiAction<'2'> | Array<AiopsLogRateAnalysisApiAction<'2'>>
): StreamState {
  if (Array.isArray(action)) {
    return action.reduce(streamReducer, state);
  }

  switch (action.type) {
    case API_ACTION_NAME.ADD_SIGNIFICANT_ITEMS:
      return { ...state, significantItems: [...state.significantItems, ...action.payload] };
    case API_ACTION_NAME.ADD_SIGNIFICANT_ITEMS_HISTOGRAM:
      const significantItems = state.significantItems.map((cp) => {
        const cpHistogram = action.payload.find(
          (h) => h.fieldName === cp.fieldName && h.fieldValue === cp.fieldValue
        );
        if (cpHistogram) {
          cp.histogram = cpHistogram.histogram;
        }
        return cp;
      });
      return { ...state, significantItems };
    case API_ACTION_NAME.ADD_SIGNIFICANT_ITEMS_GROUP:
      return { ...state, significantItemsGroups: action.payload };
    case API_ACTION_NAME.ADD_SIGNIFICANT_ITEMS_GROUP_HISTOGRAM:
      const significantItemsGroups = state.significantItemsGroups.map((cpg) => {
        const cpHistogram = action.payload.find((h) => h.id === cpg.id);
        if (cpHistogram) {
          cpg.histogram = cpHistogram.histogram;
        }
        return cpg;
      });
      return { ...state, significantItemsGroups };
    case API_ACTION_NAME.ADD_ERROR:
      return { ...state, errors: [...state.errors, action.payload] };
    case API_ACTION_NAME.RESET_ERRORS:
      return { ...state, errors: [] };
    case API_ACTION_NAME.RESET_GROUPS:
      return { ...state, significantItemsGroups: [] };
    case API_ACTION_NAME.RESET_ALL:
      return initialState;
    case API_ACTION_NAME.UPDATE_LOADING_STATE:
      return { ...state, ...action.payload };
    case API_ACTION_NAME.SET_ZERO_DOCS_FALLBACK:
      return { ...state, zeroDocsFallback: action.payload };
    case API_ACTION_NAME.JLOUVAIN:
      return { ...state, ...action.payload };
    default:
      return state;
  }
}
