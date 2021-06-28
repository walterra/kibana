/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useState } from 'react';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n/react';
import { HelpPopover, HelpPopoverButton } from '../help_popover/help_popover';

export function LatencyCorrelationsHelpPopover() {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  return (
    <HelpPopover
      anchorPosition="upCenter"
      button={
        <HelpPopoverButton
          onClick={() => {
            setIsPopoverOpen(!isPopoverOpen);
          }}
        />
      }
      closePopover={() => setIsPopoverOpen(false)}
      isOpen={isPopoverOpen}
      title={i18n.translate('xpack.apm.correlations.latencyPopoverTitle', {
        defaultMessage: 'Latency correlations',
      })}
    >
      <p>
        <FormattedMessage
          id="xpack.apm.correlations.latencyPopoverBasicExplanation"
          defaultMessage="Correlations help you discover which fields are contributing to increased service response times or latency."
        />
      </p>
    </HelpPopover>
  );
}
