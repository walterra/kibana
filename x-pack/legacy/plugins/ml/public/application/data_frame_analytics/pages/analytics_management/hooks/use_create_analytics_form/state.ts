/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { EuiComboBoxOptionOption } from '@elastic/eui';
import { DeepPartial } from '../../../../../../../common/types/common';
import { checkPermission } from '../../../../../privilege/check_privilege';
import { mlNodesAvailable } from '../../../../../ml_nodes_check/check_ml_nodes';

import { DataFrameAnalyticsId, DataFrameAnalyticsConfig } from '../../../../common';

export enum DEFAULT_MODEL_MEMORY_LIMIT {
  regression = '100mb',
  // eslint-disable-next-line @typescript-eslint/camelcase
  outlier_detection = '50mb',
  classification = '100mb',
}

export type EsIndexName = string;
export type DependentVariable = string;
export type IndexPatternTitle = string;
export type AnalyticsJobType = JOB_TYPES | undefined;
type IndexPatternId = string;
export type SourceIndexMap = Record<
  IndexPatternTitle,
  { label: IndexPatternTitle; value: IndexPatternId }
>;

export interface FormMessage {
  error?: string;
  message: string;
}

export enum JOB_TYPES {
  OUTLIER_DETECTION = 'outlier_detection',
  REGRESSION = 'regression',
  CLASSIFICATION = 'classification',
}

export interface State {
  advancedEditorMessages: FormMessage[];
  advancedEditorRawString: string;
  form: {
    createIndexPattern: boolean;
    dependentVariable: DependentVariable;
    dependentVariableFetchFail: boolean;
    dependentVariableOptions: EuiComboBoxOptionOption[];
    description: string;
    destinationIndex: EsIndexName;
    destinationIndexNameExists: boolean;
    destinationIndexNameEmpty: boolean;
    destinationIndexNameValid: boolean;
    destinationIndexPatternTitleExists: boolean;
    excludes: string[];
    excludesOptions: EuiComboBoxOptionOption[];
    fieldOptionsFetchFail: boolean;
    jobId: DataFrameAnalyticsId;
    jobIdExists: boolean;
    jobIdEmpty: boolean;
    jobIdInvalidMaxLength: boolean;
    jobIdValid: boolean;
    jobType: AnalyticsJobType;
    loadingDepVarOptions: boolean;
    loadingFieldOptions: boolean;
    maxDistinctValuesError: string | undefined;
    modelMemoryLimit: string | undefined;
    modelMemoryLimitUnitValid: boolean;
    modelMemoryLimitValidationResult: any;
    previousJobType: null | AnalyticsJobType;
    previousSourceIndex: EsIndexName | undefined;
    sourceIndex: EsIndexName;
    sourceIndexNameEmpty: boolean;
    sourceIndexNameValid: boolean;
    sourceIndexContainsNumericalFields: boolean;
    sourceIndexFieldsCheckFailed: boolean;
    trainingPercent: number;
    isClone?: boolean;
  };
  disabled: boolean;
  indexNames: EsIndexName[];
  indexPatternsMap: SourceIndexMap;
  isAdvancedEditorEnabled: boolean;
  isJobCreated: boolean;
  isJobStarted: boolean;
  isModalButtonDisabled: boolean;
  isModalVisible: boolean;
  isValid: boolean;
  jobConfig: DeepPartial<DataFrameAnalyticsConfig>;
  jobIds: DataFrameAnalyticsId[];
  requestMessages: FormMessage[];
  estimatedModelMemoryLimit: string;
}

export const getInitialState = (): State => ({
  advancedEditorMessages: [],
  advancedEditorRawString: '',
  form: {
    createIndexPattern: false,
    dependentVariable: '',
    dependentVariableFetchFail: false,
    dependentVariableOptions: [],
    description: '',
    destinationIndex: '',
    destinationIndexNameExists: false,
    destinationIndexNameEmpty: true,
    destinationIndexNameValid: false,
    destinationIndexPatternTitleExists: false,
    excludes: [],
    fieldOptionsFetchFail: false,
    excludesOptions: [],
    jobId: '',
    jobIdExists: false,
    jobIdEmpty: true,
    jobIdInvalidMaxLength: false,
    jobIdValid: false,
    jobType: undefined,
    loadingDepVarOptions: false,
    loadingFieldOptions: false,
    maxDistinctValuesError: undefined,
    modelMemoryLimit: undefined,
    modelMemoryLimitUnitValid: true,
    modelMemoryLimitValidationResult: null,
    previousJobType: null,
    previousSourceIndex: undefined,
    sourceIndex: '',
    sourceIndexNameEmpty: true,
    sourceIndexNameValid: false,
    sourceIndexContainsNumericalFields: true,
    sourceIndexFieldsCheckFailed: false,
    trainingPercent: 80,
  },
  jobConfig: {},
  disabled:
    !mlNodesAvailable() ||
    !checkPermission('canCreateDataFrameAnalytics') ||
    !checkPermission('canStartStopDataFrameAnalytics'),
  indexNames: [],
  indexPatternsMap: {},
  isAdvancedEditorEnabled: false,
  isJobCreated: false,
  isJobStarted: false,
  isModalVisible: false,
  isModalButtonDisabled: false,
  isValid: false,
  jobIds: [],
  requestMessages: [],
  estimatedModelMemoryLimit: '',
});

export const getJobConfigFromFormState = (
  formState: State['form']
): DeepPartial<DataFrameAnalyticsConfig> => {
  const jobConfig: DeepPartial<DataFrameAnalyticsConfig> = {
    description: formState.description,
    source: {
      // If a Kibana index patterns includes commas, we need to split
      // the into an array of indices to be in the correct format for
      // the data frame analytics API.
      index: formState.sourceIndex.includes(',')
        ? formState.sourceIndex.split(',').map(d => d.trim())
        : formState.sourceIndex,
    },
    dest: {
      index: formState.destinationIndex,
    },
    analyzed_fields: {
      excludes: formState.excludes,
    },
    analysis: {
      outlier_detection: {},
    },
    model_memory_limit: formState.modelMemoryLimit,
  };

  if (
    formState.jobType === JOB_TYPES.REGRESSION ||
    formState.jobType === JOB_TYPES.CLASSIFICATION
  ) {
    jobConfig.analysis = {
      [formState.jobType]: {
        dependent_variable: formState.dependentVariable,
        training_percent: formState.trainingPercent,
      },
    };
  }

  return jobConfig;
};

/**
 * Extracts form state for a job clone from the analytics job configuration.
 * For cloning we keep job id and destination index empty.
 */
export function getCloneFormStateFromJobConfig(
  analyticsJobConfig: DataFrameAnalyticsConfig
): Partial<State['form']> {
  const jobType: string = Object.keys(analyticsJobConfig.analysis)[0];

  const resultState: Partial<State['form']> = {
    isClone: true,
    jobType: jobType as AnalyticsJobType,
    description: analyticsJobConfig.description ?? '',
    sourceIndex: Array.isArray(analyticsJobConfig.source.index)
      ? analyticsJobConfig.source.index.join(',')
      : analyticsJobConfig.source.index,
    modelMemoryLimit: analyticsJobConfig.model_memory_limit,
    excludes: analyticsJobConfig.analyzed_fields.excludes,
  };

  if (jobType === JOB_TYPES.REGRESSION || jobType === JOB_TYPES.CLASSIFICATION) {
    // @ts-ignore
    const analysisConfig = analyticsJobConfig.analysis[jobType];

    resultState.dependentVariable = analysisConfig!.dependent_variable;
    resultState.trainingPercent = analysisConfig!.training_percent;
  }

  return resultState;
}
