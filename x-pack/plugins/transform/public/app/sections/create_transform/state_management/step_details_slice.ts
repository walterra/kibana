/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { createFormSlice } from '@kbn/ml-form-utils/form_slice';

import { validators } from '../../edit_transform/state_management/validators';

import {
  getDefaultStepDetailsState,
  getStepDetailsFormFields,
  getStepDetailsFormSections,
  type StepDetailsState,
} from '../components/step_details';

export const stepDetailsFormSlice = createFormSlice(
  'stepDetailsForm',
  getStepDetailsFormFields(),
  getStepDetailsFormSections(),
  validators
);
export type StepDetailsFormState = ReturnType<typeof stepDetailsFormSlice.getInitialState>;

export const { initialize, setFormField, setFormSection, setSubmitErrorMessage } =
  stepDetailsFormSlice.actions;

export const stepDetailsSlice = createSlice({
  name: 'stepDetails',
  initialState: getDefaultStepDetailsState(),
  reducers: {
    setStepDetailsState: (_, action: PayloadAction<StepDetailsState>) => action.payload,
    setTransformFrequency: (state, action: PayloadAction<string>) => {
      state.transformFrequency = action.payload;
    },
    setTransformSettingsMaxPageSearchSize: (
      state,
      action: PayloadAction<StepDetailsState['transformSettingsMaxPageSearchSize']>
    ) => {
      state.transformSettingsMaxPageSearchSize = action.payload;
    },
    setTransformSettingsDocsPerSecond: (state, action: PayloadAction<number>) => {
      state.transformSettingsDocsPerSecond = action.payload;
    },
    setTransformSettingsNumFailureRetries: (
      state,
      action: PayloadAction<StepDetailsState['transformSettingsNumFailureRetries']>
    ) => {
      state.transformSettingsNumFailureRetries = action.payload;
    },
    setValid: (state, action: PayloadAction<boolean>) => {
      state.valid = action.payload;
    },
  },
});
