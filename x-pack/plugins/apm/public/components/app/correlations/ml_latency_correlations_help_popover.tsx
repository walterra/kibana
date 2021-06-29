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
      anchorPosition="leftUp"
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
      <p>
        <FormattedMessage
          id="xpack.apm.correlations.latencyPopoverChartExplanation"
          defaultMessage="The latency distribution chart visualizes the overall latency of the service and the attributes that are most likely responsible for slow transactions. You can view the impact of other attributes by selecting them in the table."
        />
      </p>
      <p>
        <FormattedMessage
          id="xpack.apm.correlations.latencyPopoverTableExplanation"
          defaultMessage="The table is sorted by correlation values, which are derived by using a combination of Pearson correlation coefficient (PCC) and Kolmogorov–Smirnov (K-S) tests and range from 0 to 1. Attributes with a high correlation are likely to contribute to increased latency."
        />
      </p>
      <p>
        <FormattedMessage
          id="xpack.apm.correlations.latencyPopoverFilterExplanation"
          defaultMessage="You can also add or remove filters to affect the queries in the APM app."
        />
      </p>
    </HelpPopover>
  );
}
