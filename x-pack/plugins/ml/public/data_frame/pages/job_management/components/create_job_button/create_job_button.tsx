/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { SFC } from 'react';

import { EuiButton, EuiToolTip } from '@elastic/eui';

import { FormattedMessage } from '@kbn/i18n/react';

// @ts-ignore
import { createPermissionFailureMessage } from '../../../../../privilege/check_privilege';
// @ts-ignore
import { checkPermission } from '../../../../../privilege/check_privilege';

function newJob() {
  window.location.href = `#/data_frame/new_job`;
}

export const CreateJobButton: SFC = () => {
  const canCreateDataFrameJob: boolean = checkPermission('canCreateDataFrameJob');

  const button = (
    <EuiButton
      disabled={!canCreateDataFrameJob}
      fill
      onClick={newJob}
      iconType="plusInCircle"
      size="s"
    >
      <FormattedMessage
        id="xpack.ml.dataframe.jobsList.createDataFrameButton"
        defaultMessage="Create data frame"
      />
    </EuiButton>
  );

  if (!canCreateDataFrameJob) {
    return (
      <EuiToolTip position="top" content={createPermissionFailureMessage('canCreateDataFrameJob')}>
        {button}
      </EuiToolTip>
    );
  }

  return button;
};
