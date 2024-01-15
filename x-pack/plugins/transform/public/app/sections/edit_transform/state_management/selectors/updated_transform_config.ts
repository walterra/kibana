/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useMemo } from 'react';
import { createSelector } from '@reduxjs/toolkit';
import { useSelector } from 'react-redux';

import { applyFormStateToConfig } from '@kbn/ml-form-utils/apply_form_state_to_config';
import { createSelectFormFields } from '@kbn/ml-form-utils/use_form_field';
import { createSelectFormSections } from '@kbn/ml-form-utils/use_form_section';

import type { TransformConfigUnion } from '../../../../../../common/types/transform';

import { useEditTransformFlyoutContext } from '../edit_transform_flyout_state';

const createSelectTransformConfig = (originalConfig: TransformConfigUnion) =>
  createSelector(
    createSelectFormFields('editTransformForm'),
    createSelectFormSections('editTransformForm'),
    (formFields, formSections) => applyFormStateToConfig(originalConfig, formFields, formSections)
  );

export const useUpdatedTransformConfig = () => {
  const { config } = useEditTransformFlyoutContext();
  const selectTransformConfig = useMemo(() => createSelectTransformConfig(config), [config]);
  return useSelector(selectTransformConfig);
};
