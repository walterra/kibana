/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { type FC } from 'react';

import { i18n } from '@kbn/i18n';

import { useWizardActions, useWizardSelector } from '../../state_management/create_transform_store';
import { WIZARD_STEPS } from '../../state_management/wizard_slice';

import { WizardNav } from '../wizard_nav';

import { StepDetailsForm } from './step_details_form';
import { StepDetailsSummary } from './step_details_summary';

export const StepDetails: FC = () => {
  const currentStep = useWizardSelector((s) => s.wizard.currentStep);
  const stepDetailsState = useWizardSelector((s) => s.stepDetails);

  const { setCurrentStep } = useWizardActions();

  return stepDetailsState ? (
    <>
      {currentStep === WIZARD_STEPS.DETAILS ? (
        <StepDetailsForm />
      ) : (
        <StepDetailsSummary {...stepDetailsState} />
      )}
      {currentStep === WIZARD_STEPS.DETAILS && (
        <WizardNav
          previous={() => {
            setCurrentStep(WIZARD_STEPS.DEFINE);
          }}
          next={() => setCurrentStep(WIZARD_STEPS.CREATE)}
          nextActive={stepDetailsState.valid}
        />
      )}
    </>
  ) : null;
};

export const euiStepDetails = {
  title: i18n.translate('xpack.transform.transformsWizard.stepDetailsTitle', {
    defaultMessage: 'Transform details',
  }),
  children: <StepDetails />,
};
