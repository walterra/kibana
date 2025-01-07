/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/*
 * React component for the header section of the calendars list page.
 */

import type { FC } from 'react';
import React from 'react';

import {
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiText,
  EuiTextColor,
  EuiButtonEmpty,
} from '@elastic/eui';

import { FormattedMessage } from '@kbn/i18n-react';
import { useMlKibana } from '@kbn/ml-kibana-context';

import { MlPageHeader } from '../../../components/page_header';

interface Props {
  isDst: boolean;
  totalCount: number;
  refreshCalendars: () => void;
}

export const CalendarsListHeader: FC<Props> = ({ totalCount, refreshCalendars, isDst }) => {
  const {
    services: {
      docLinks: { links },
    },
  } = useMlKibana();
  const docsUrl = links.ml.calendars;
  return (
    <>
      <MlPageHeader>
        {isDst ? (
          <FormattedMessage
            id="xpack.ml.settings.calendars.listHeader.calendarsTitle"
            defaultMessage="Daylight savings time calendars"
          />
        ) : (
          <FormattedMessage
            id="xpack.ml.settings.calendars.listHeader.calendarsTitle"
            defaultMessage="Calendars"
          />
        )}
      </MlPageHeader>
      <EuiFlexGroup justifyContent="spaceBetween" alignItems="baseline">
        <EuiFlexItem grow={false}>
          <EuiFlexGroup alignItems="baseline" gutterSize="m" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiTextColor color="subdued">
                <p>
                  <FormattedMessage
                    id="xpack.ml.settings.calendars.listHeader.calendarsListTotalCount"
                    defaultMessage="{totalCount} in total"
                    values={{
                      totalCount,
                    }}
                  />
                </p>
              </EuiTextColor>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiFlexGroup alignItems="baseline" gutterSize="m" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                size="s"
                iconType="refresh"
                onClick={refreshCalendars}
                data-test-subj="mlCalendarListRefreshButton"
              >
                <FormattedMessage
                  id="xpack.ml.settings.calendars.listHeader.refreshButtonLabel"
                  defaultMessage="Refresh"
                />
              </EuiButtonEmpty>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="m" />
      <EuiText>
        <p>
          <EuiTextColor color="subdued">
            {isDst ? (
              <FormattedMessage
                id="xpack.ml.settings.calendars.listHeader.calendarsDstDescription"
                defaultMessage="DST calendars contain a list of scheduled events for which you do not want to generate anomalies, taking into account daylight saving time shifts that may cause events to occur one hour earlier or later. The same calendar can be assigned to multiple jobs.{br}{learnMoreLink}"
                values={{
                  br: <br />,
                  learnMoreLink: (
                    <EuiLink href={docsUrl} target="_blank">
                      <FormattedMessage
                        id="xpack.ml.settings.calendars.listHeader.calendarsDstDescription.learnMoreLinkText"
                        defaultMessage="Learn more"
                      />
                    </EuiLink>
                  ),
                }}
              />
            ) : (
              <FormattedMessage
                id="xpack.ml.settings.calendars.listHeader.calendarsDescription"
                defaultMessage="Calendars contain a list of scheduled events for which you do not want to generate anomalies,
              such as planned system outages or public holidays. The same calendar can be assigned to multiple jobs.{br}{learnMoreLink}"
                values={{
                  br: <br />,
                  learnMoreLink: (
                    <EuiLink href={docsUrl} target="_blank">
                      <FormattedMessage
                        id="xpack.ml.settings.calendars.listHeader.calendarsDescription.learnMoreLinkText"
                        defaultMessage="Learn more"
                      />
                    </EuiLink>
                  ),
                }}
              />
            )}
          </EuiTextColor>
        </p>
      </EuiText>
      <EuiSpacer size="m" />
    </>
  );
};
