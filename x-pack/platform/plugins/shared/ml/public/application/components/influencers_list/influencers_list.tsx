/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/*
 * React component for rendering a list of Machine Learning influencers.
 */

import type { FC } from 'react';
import React from 'react';

import { EuiFlexGroup, EuiFlexItem, EuiSpacer, EuiTitle, EuiToolTip } from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n-react';

import { getSeverity } from '@kbn/ml-anomaly-utils/get_severity';
import { getFormattedSeverityScore } from '@kbn/ml-anomaly-utils/get_formatted_severity_score';
import { abbreviateWholeNumber } from '../../formatters/abbreviate_whole_number';
import type { EntityCellFilter } from '../entity_cell';
import { EntityCell } from '../entity_cell';
import { useInfluencersListStyles } from './influencers_list_styles';

export interface InfluencerValueData {
  influencerFieldValue: string;
  maxAnomalyScore: number;
  sumAnomalyScore: number;
}

interface InfluencerProps {
  influencerFieldName: string;
  influencerFilter: EntityCellFilter;
  valueData: InfluencerValueData;
}

interface InfluencersByNameProps {
  influencerFieldName: string;
  influencerFilter: EntityCellFilter;
  fieldValues: InfluencerValueData[];
}

interface InfluencersListProps {
  influencers: { [id: string]: InfluencerValueData[] };
  influencerFilter: EntityCellFilter;
}

function getTooltipContent(maxScoreLabel: string, totalScoreLabel: string) {
  return (
    <React.Fragment>
      <p>
        <FormattedMessage
          id="xpack.ml.influencersList.maxAnomalyScoreTooltipDescription"
          defaultMessage="Maximum anomaly score: {maxScoreLabel}"
          values={{ maxScoreLabel }}
        />
      </p>
      <p>
        <FormattedMessage
          id="xpack.ml.influencersList.totalAnomalyScoreTooltipDescription"
          defaultMessage="Total anomaly score: {totalScoreLabel}"
          values={{ totalScoreLabel }}
        />
      </p>
    </React.Fragment>
  );
}

const Influencer: FC<InfluencerProps> = ({ influencerFieldName, influencerFilter, valueData }) => {
  const styles = useInfluencersListStyles();
  const maxScore = Math.floor(valueData.maxAnomalyScore);
  const maxScoreLabel = getFormattedSeverityScore(valueData.maxAnomalyScore);
  const severity = getSeverity(maxScore);
  const totalScore = Math.floor(valueData.sumAnomalyScore);
  const totalScoreLabel = getFormattedSeverityScore(valueData.sumAnomalyScore);

  // Ensure the bar has some width for 0 scores.
  const barScore = maxScore !== 0 ? maxScore : 1;

  const tooltipContent = getTooltipContent(maxScoreLabel, totalScoreLabel);

  return (
    <div data-test-subj={`mlInfluencerEntry field-${influencerFieldName}`}>
      <div css={styles.fieldLabel} data-test-subj="mlInfluencerEntryFieldLabel">
        <EntityCell
          entityName={influencerFieldName}
          entityValue={valueData.influencerFieldValue}
          filter={influencerFilter}
        />
      </div>
      <div css={styles.progress}>
        <div css={styles.progressBarHolder}>
          <div css={styles.progressBar(severity.id, barScore)} />
        </div>
        <div css={styles.scoreLabel(severity.id)}>
          <EuiToolTip
            position="right"
            title={`${influencerFieldName}: ${valueData.influencerFieldValue}`}
            content={tooltipContent}
          >
            <span>{maxScoreLabel}</span>
          </EuiToolTip>
        </div>
      </div>
      <div css={styles.totalScoreLabel}>
        <EuiToolTip
          position="right"
          title={`${influencerFieldName}: ${valueData.influencerFieldValue}`}
          content={tooltipContent}
        >
          <span>{totalScore > 0 ? abbreviateWholeNumber(totalScore, 4) : totalScoreLabel}</span>
        </EuiToolTip>
      </div>
    </div>
  );
};

const InfluencersByName: FC<InfluencersByNameProps> = ({
  influencerFieldName,
  influencerFilter,
  fieldValues,
}) => {
  const influencerValues = fieldValues.map((valueData) => (
    <Influencer
      key={valueData.influencerFieldValue}
      influencerFieldName={influencerFieldName}
      influencerFilter={influencerFilter}
      valueData={valueData}
    />
  ));

  return (
    <React.Fragment key={influencerFieldName}>
      <EuiTitle size="xxs" data-test-subj={`mlInfluencerFieldName ${influencerFieldName}`}>
        <h3>{influencerFieldName}</h3>
      </EuiTitle>
      <EuiSpacer size="xs" />
      {influencerValues}

      <EuiSpacer size="m" />
    </React.Fragment>
  );
};

export const InfluencersList: FC<InfluencersListProps> = ({ influencers, influencerFilter }) => {
  const styles = useInfluencersListStyles();

  if (influencers === undefined || Object.keys(influencers).length === 0) {
    return (
      <EuiFlexGroup justifyContent="spaceAround" css={styles.influencersList}>
        <EuiFlexItem grow={false}>
          <EuiSpacer size="xxl" />
          <EuiTitle size="xxs">
            <h3>
              <FormattedMessage
                id="xpack.ml.influencersList.noInfluencersFoundTitle"
                defaultMessage="No influencers found"
              />
            </h3>
          </EuiTitle>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  const influencersByName = Object.keys(influencers).map((influencerFieldName) => (
    <InfluencersByName
      key={influencerFieldName}
      influencerFieldName={influencerFieldName}
      influencerFilter={influencerFilter}
      fieldValues={influencers[influencerFieldName]}
    />
  ));

  return <div css={styles.influencersList}>{influencersByName}</div>;
};
