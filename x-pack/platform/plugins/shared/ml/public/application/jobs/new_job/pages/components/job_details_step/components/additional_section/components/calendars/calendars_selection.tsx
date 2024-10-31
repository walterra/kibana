/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { FC } from 'react';
import React, { useContext, useEffect, useState } from 'react';
import { FormattedMessage } from '@kbn/i18n-react';
import type { EuiComboBoxOptionOption, EuiComboBoxProps } from '@elastic/eui';
import {
  EuiButtonIcon,
  EuiComboBox,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiSpacer,
  EuiText,
  EuiToolTip,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { ML_PAGES } from '@kbn/ml-common-types/locator_ml_pages';
import { PLUGIN_ID } from '@kbn/ml-common-constants/app';
import type { MlCalendar } from '@kbn/ml-common-types/calendars';
import { GLOBAL_CALENDAR } from '@kbn/ml-common-constants/calendars';
import {
  filterCalendarsForDst,
  separateCalendarsByType,
} from '../../../../../../../../../settings/calendars/dst_utils';
import { JobCreatorContext } from '../../../../../job_creator_context';
import { Description } from './description';
import { useMlApi, useMlKibana } from '../../../../../../../../../contexts/kibana';
import { DescriptionDst } from './description_dst';

interface Props {
  isDst?: boolean;
}

export const CalendarsSelection: FC<Props> = ({ isDst = false }) => {
  const {
    services: {
      application: { getUrlForApp },
    },
  } = useMlKibana();
  const mlApi = useMlApi();

  const { jobCreator, jobCreatorUpdate } = useContext(JobCreatorContext);
  const [selectedCalendars, setSelectedCalendars] = useState<MlCalendar[]>(
    filterCalendarsForDst(jobCreator.calendars, isDst)
  );
  const [selectedOptions, setSelectedOptions] = useState<
    Array<EuiComboBoxOptionOption<MlCalendar>>
  >([]);
  const [options, setOptions] = useState<Array<EuiComboBoxOptionOption<MlCalendar>>>([]);
  const [isLoading, setIsLoading] = useState(false);

  async function loadCalendars() {
    setIsLoading(true);
    const { calendars, calendarsDst } = separateCalendarsByType(await mlApi.calendars());
    const filteredCalendars = (isDst ? calendarsDst : calendars).filter(
      (c) => c.job_ids.includes(GLOBAL_CALENDAR) === false
    );
    setOptions(filteredCalendars.map((c) => ({ label: c.calendar_id, value: c })));
    setSelectedOptions(selectedCalendars.map((c) => ({ label: c.calendar_id, value: c })));
    setIsLoading(false);
  }

  useEffect(() => {
    loadCalendars();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const { calendars, calendarsDst } = separateCalendarsByType(jobCreator.calendars);
    const otherCalendars = isDst ? calendars : calendarsDst;
    jobCreator.calendars = [...selectedCalendars, ...otherCalendars];
    jobCreatorUpdate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCalendars.join()]);

  const comboBoxProps: EuiComboBoxProps<MlCalendar> = {
    async: true,
    options,
    selectedOptions,
    isLoading,
    onChange: (optionsIn) => {
      setSelectedOptions(optionsIn);
      setSelectedCalendars(optionsIn.map((o) => o.value!));
    },
  };

  const manageCalendarsHref = getUrlForApp(PLUGIN_ID, {
    path: isDst ? ML_PAGES.CALENDARS_DST_MANAGE : ML_PAGES.CALENDARS_MANAGE,
  });

  const Desc = isDst ? DescriptionDst : Description;

  return (
    <Desc>
      <EuiFlexGroup gutterSize="xs" alignItems="center">
        <EuiFlexItem>
          <EuiComboBox {...comboBoxProps} data-test-subj="mlJobWizardComboBoxCalendars" />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiToolTip
            position="right"
            content={
              <FormattedMessage
                id="xpack.ml.newJob.wizard.jobDetailsStep.additionalSection.calendarsSelection.refreshCalendarsButtonLabel"
                defaultMessage="Refresh calendars"
              />
            }
          >
            <EuiButtonIcon
              iconType="refresh"
              color="primary"
              aria-label={i18n.translate(
                'xpack.ml.newJob.wizard.jobDetailsStep.additionalSection.calendarsSelection.refreshCalendarsButtonLabel',
                {
                  defaultMessage: 'Refresh calendars',
                }
              )}
              onClick={loadCalendars}
            />
          </EuiToolTip>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="xs" />
      <EuiText size="s">
        <EuiLink href={manageCalendarsHref} target="_blank" external>
          <FormattedMessage
            id="xpack.ml.newJob.wizard.jobDetailsStep.additionalSection.calendarsSelection.manageCalendarsButtonLabel"
            defaultMessage="Manage calendars"
          />
        </EuiLink>
      </EuiText>
    </Desc>
  );
};
