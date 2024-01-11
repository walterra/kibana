/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { type FC } from 'react';

import { i18n } from '@kbn/i18n';

import { EuiAccordion, EuiFormRow, EuiSpacer } from '@elastic/eui';

import { useWizardSelector } from '../../state_management/create_transform_store';

export const StepDetailsSummary: FC = () => {
  const {
    continuousModeDateField,
    createDataView,
    isContinuousModeEnabled,
    isRetentionPolicyEnabled,
    retentionPolicyDateField,
    retentionPolicyMaxAge,
    transformId,
    transformDescription,
    transformFrequency,
    transformSettingsMaxPageSearchSize,
    transformSettingsNumFailureRetries,
    destinationIndex,
    destinationIngestPipeline,
    dataViewTimeField,
    valid,
  } = useWizardSelector((s) => s.stepDetails);

  if (!valid) return null;

  const destinationIndexHelpText = createDataView
    ? i18n.translate('xpack.transform.stepDetailsSummary.createDataViewMessage', {
        defaultMessage: 'A Kibana data view will be created for this transform.',
      })
    : '';

  return (
    <div data-test-subj="transformStepDetailsSummary">
      <EuiFormRow
        label={i18n.translate('xpack.transform.stepDetailsSummary.transformIdLabel', {
          defaultMessage: 'Transform ID',
        })}
      >
        <span>{transformId}</span>
      </EuiFormRow>

      {transformDescription !== '' && (
        <EuiFormRow
          label={i18n.translate('xpack.transform.stepDetailsSummary.transformDescriptionLabel', {
            defaultMessage: 'Transform description',
          })}
        >
          <span>{transformDescription}</span>
        </EuiFormRow>
      )}

      <EuiFormRow
        helpText={destinationIndexHelpText}
        label={i18n.translate('xpack.transform.stepDetailsSummary.destinationIndexLabel', {
          defaultMessage: 'Destination index',
        })}
      >
        <span>{destinationIndex}</span>
      </EuiFormRow>
      {createDataView && dataViewTimeField !== undefined && dataViewTimeField !== '' && (
        <EuiFormRow
          label={i18n.translate('xpack.transform.stepDetailsSummary.dataViewTimeFieldLabel', {
            defaultMessage: 'Kibana data view time field',
          })}
        >
          <span>{dataViewTimeField}</span>
        </EuiFormRow>
      )}

      {destinationIngestPipeline !== undefined && destinationIngestPipeline !== '' && (
        <EuiFormRow
          label={i18n.translate(
            'xpack.transform.stepDetailsSummary.destinationIngestPipelineLabel',
            {
              defaultMessage: 'Destination ingest pipeline',
            }
          )}
        >
          <span>{destinationIngestPipeline}</span>
        </EuiFormRow>
      )}

      {isContinuousModeEnabled && (
        <EuiFormRow
          label={i18n.translate('xpack.transform.stepDetailsSummary.continuousModeDateFieldLabel', {
            defaultMessage: 'Continuous mode date field',
          })}
        >
          <span>{continuousModeDateField}</span>
        </EuiFormRow>
      )}

      {isRetentionPolicyEnabled && (
        <>
          <EuiFormRow
            label={i18n.translate(
              'xpack.transform.stepDetailsSummary.retentionPolicyDateFieldLabel',
              {
                defaultMessage: 'Retention policy date field',
              }
            )}
          >
            <span>{retentionPolicyDateField}</span>
          </EuiFormRow>
          <EuiFormRow
            label={i18n.translate('xpack.transform.stepDetailsSummary.retentionPolicyMaxAgeLabel', {
              defaultMessage: 'Retention policy max age',
            })}
          >
            <span>{retentionPolicyMaxAge}</span>
          </EuiFormRow>
        </>
      )}

      <EuiSpacer size="l" />

      <EuiAccordion
        data-test-subj="transformWizardAccordionAdvancedSettingsSummary"
        id="transformWizardAccordionAdvancedSettingsSummary"
        buttonContent={i18n.translate(
          'xpack.transform.stepDetailsSummary.advancedSettingsAccordionButtonContent',
          {
            defaultMessage: 'Advanced settings',
          }
        )}
        paddingSize="s"
      >
        <EuiFormRow
          data-test-subj={'transformWizardAdvancedSettingsFrequencyLabel'}
          label={i18n.translate('xpack.transform.stepDetailsSummary.frequencyLabel', {
            defaultMessage: 'Frequency',
          })}
        >
          <span>{transformFrequency}</span>
        </EuiFormRow>
        <EuiFormRow
          data-test-subj={'transformWizardAdvancedSettingsMaxPageSearchSizeLabel'}
          label={i18n.translate('xpack.transform.stepDetailsSummary.maxPageSearchSizeLabel', {
            defaultMessage: 'Maximum page search size',
          })}
        >
          <span>{transformSettingsMaxPageSearchSize}</span>
        </EuiFormRow>
        {typeof transformSettingsNumFailureRetries === 'number' ? (
          <EuiFormRow
            data-test-subj={'transformWizardAdvancedSettingsNumFailureRetriesLabel'}
            label={i18n.translate('xpack.transform.stepDetailsSummary.numFailureRetriesLabel', {
              defaultMessage: 'Number of retries',
            })}
          >
            <span>{transformSettingsNumFailureRetries}</span>
          </EuiFormRow>
        ) : null}
      </EuiAccordion>
    </div>
  );
};
