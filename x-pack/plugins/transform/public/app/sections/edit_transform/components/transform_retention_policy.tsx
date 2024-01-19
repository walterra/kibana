/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import type { Draft } from 'immer';

import { EuiFormRow, EuiSelect, EuiSpacer, EuiSwitch } from '@elastic/eui';

import { i18n } from '@kbn/i18n';
import { FormTextInput } from '@kbn/ml-form-utils/components/form_text_input';
import { useFormField } from '@kbn/ml-form-utils/use_form_field';
import { useFormSection } from '@kbn/ml-form-utils/use_form_sections';
import { type FormSlice, type State } from '@kbn/ml-form-utils/form_slice';

import type { PostTransformsPreviewRequestSchema } from '../../../../../common/api_schemas/transforms';

import { useDestIndexAvailableTimeFields } from '../../../hooks';

import { useDataView } from '../../create_transform/components/wizard/wizard';

export const TransformRetentionPolicy = <FF extends string, FS extends string, VN extends string>({
  slice,
  previewRequest,
}: {
  slice: FormSlice<FF | 'retentionPolicyField', FS | 'retentionPolicy', VN>;
  previewRequest: PostTransformsPreviewRequestSchema;
}) => {
  type ActionFormFields = keyof Draft<
    State<FF | 'retentionPolicyField', FS | 'retentionPolicy', VN>
  >['formFields'];
  type ActionFormSections = keyof Draft<
    State<FF | 'retentionPolicyField', FS | 'retentionPolicy', VN>
  >['formSections'];

  const dispatch = useDispatch();
  const dataView = useDataView();
  const dataViewId = dataView.id;
  const retentionPolicyField = useFormField(slice, 'retentionPolicyField');
  const retentionPolicySection = useFormSection(slice, 'retentionPolicy');
  const destIndexAvailableTimeFields = useDestIndexAvailableTimeFields(previewRequest);

  const isLoading = destIndexAvailableTimeFields === undefined;
  const isRetentionPolicyAvailable =
    Array.isArray(destIndexAvailableTimeFields) && destIndexAvailableTimeFields.length > 0;

  useEffect(() => {
    if (!isLoading && !isRetentionPolicyAvailable && retentionPolicyField.value !== '') {
      dispatch(
        slice.actions.setFormField({
          field: 'retentionPolicyField' as ActionFormFields,
          value: '',
        })
      );
    }
    // custom comparison
    /* eslint-disable react-hooks/exhaustive-deps */
  }, [isLoading, isRetentionPolicyAvailable]);

  const retentionDateFieldOptions = useMemo(() => {
    return Array.isArray(destIndexAvailableTimeFields)
      ? destIndexAvailableTimeFields.map((text: string) => ({ text, value: text }))
      : [];
  }, [destIndexAvailableTimeFields]);

  return (
    <>
      <EuiFormRow
        helpText={
          !isLoading && isRetentionPolicyAvailable === false
            ? i18n.translate('xpack.transform.RetentionPolicyError', {
                defaultMessage:
                  'Retention policy settings are not available for indices without date fields.',
              })
            : ''
        }
      >
        <EuiSwitch
          name="transformRetentionPolicy"
          label={i18n.translate('xpack.transform.retentionPolicySwitchLabel', {
            defaultMessage: 'Retention policy',
          })}
          checked={retentionPolicySection.enabled}
          onChange={(e) =>
            dispatch(
              slice.actions.setFormSection({
                section: 'retentionPolicy' as ActionFormSections,
                enabled: e.target.checked,
              })
            )
          }
          disabled={isLoading || !isRetentionPolicyAvailable}
          data-test-subj="transformRetentionPolicySwitch"
        />
      </EuiFormRow>
      {!isLoading && retentionPolicySection.enabled && (
        <div data-test-subj="transformRetentionPolicyContent">
          <EuiSpacer size="m" />
          {
            // If data view or date fields info not available
            // gracefully defaults to text input
            dataViewId ? (
              <EuiFormRow
                label={i18n.translate('xpack.transform.retentionPolicyFieldLabel', {
                  defaultMessage: 'Date field for retention policy',
                })}
                isInvalid={retentionPolicyField.errorMessages.length > 0}
                error={retentionPolicyField.errorMessages}
                helpText={i18n.translate('xpack.transform.retentionPolicyDateFieldHelpText', {
                  defaultMessage:
                    'Select the date field that can be used to identify out of date documents in the destination index.',
                })}
              >
                <EuiSelect
                  aria-label={i18n.translate(
                    'xpack.transform.retentionPolicyFieldSelectAriaLabel',
                    {
                      defaultMessage: 'Date field to set retention policy',
                    }
                  )}
                  data-test-subj="transformRetentionPolicyDateFieldSelect"
                  options={retentionDateFieldOptions}
                  value={retentionPolicyField.value}
                  onChange={(e) =>
                    dispatch(
                      slice.actions.setFormField({
                        field: 'retentionPolicyField' as ActionFormFields,
                        value: e.target.value,
                      })
                    )
                  }
                  hasNoInitialSelection={
                    !retentionDateFieldOptions
                      .map((d) => d.text)
                      .includes(retentionPolicyField.value)
                  }
                />
              </EuiFormRow>
            ) : (
              <FormTextInput
                slice={slice}
                field={'retentionPolicyField' as FF}
                label={i18n.translate('xpack.transform.retentionPolicyFieldLabel', {
                  defaultMessage: 'Date field to set retention policy',
                })}
              />
            )
          }
          <FormTextInput
            slice={slice}
            field={'retentionPolicyMaxAge' as FF}
            label={i18n.translate(
              'xpack.transform.transformList.editFlyoutFormRetentionPolicyMaxAgeLabel',
              {
                defaultMessage: 'Max age',
              }
            )}
            helpText={i18n.translate('xpack.transform.retentionPolicyMaxAgeHelpText', {
              defaultMessage:
                'Documents that are older than the configured value will be removed from the destination index.',
            })}
          />
        </div>
      )}
    </>
  );
};
