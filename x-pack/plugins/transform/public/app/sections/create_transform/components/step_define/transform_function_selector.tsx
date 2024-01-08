/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { type FC } from 'react';

import { i18n } from '@kbn/i18n';
import { EuiCard, EuiFlexGroup, EuiFlexItem, EuiFormRow, EuiIcon, EuiSpacer } from '@elastic/eui';
import { TRANSFORM_FUNCTION } from '../../../../../../common/constants';
import { useWizardActions, useWizardSelector } from '../../state_management/create_transform_store';

export const TransformFunctionSelector: FC = () => {
  const selectedFunction = useWizardSelector((s) => s.stepDefine.transformFunction);
  const { setTransformFunction } = useWizardActions();

  const transformFunctions = [
    {
      name: TRANSFORM_FUNCTION.PIVOT,
      helpText: i18n.translate('xpack.transform.stepDefineForm.pivotHelperText', {
        defaultMessage: 'Aggregate and group your data.',
      }),
      icon: 'aggregate',
      title: i18n.translate('xpack.transform.stepDefineForm.pivotLabel', {
        defaultMessage: 'Pivot',
      }),
    },
    {
      name: TRANSFORM_FUNCTION.LATEST,
      helpText: i18n.translate('xpack.transform.stepDefineForm.latestHelperText', {
        defaultMessage: 'Keep track of your most recent data.',
      }),
      icon: 'clock',
      title: i18n.translate('xpack.transform.stepDefineForm.latestLabel', {
        defaultMessage: 'Latest',
      }),
    },
  ];

  return (
    <EuiFormRow fullWidth>
      <>
        <EuiFlexGroup gutterSize="m" data-test-subj="transformFunctionSelection">
          {transformFunctions.map(({ helpText, icon, name, title }) => (
            <EuiFlexItem key={name} style={{ width: 320 }} grow={false}>
              <EuiCard
                icon={<EuiIcon size="xl" type={icon} />}
                title={title}
                description={helpText}
                data-test-subj={`transformCreation-${name}-option${
                  selectedFunction === name ? ' selectedFunction' : ''
                }`}
                selectable={{
                  onClick: () => {
                    // Only allow one function selected at a time and don't allow deselection
                    if (selectedFunction === name) {
                      return;
                    }
                    setTransformFunction(name);
                  },
                  isSelected: selectedFunction === name,
                }}
              />
            </EuiFlexItem>
          ))}
        </EuiFlexGroup>
        <EuiSpacer size="m" />
      </>
    </EuiFormRow>
  );
};
