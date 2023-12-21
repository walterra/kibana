/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React, { FC, Fragment } from 'react';
import { EuiTextColor, EuiTitle } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import type { MlEntityField } from '@kbn/ml-anomaly-utils';

interface Props {
  entities: MlEntityField[];
  entityDataCount: number;
  functionLabel: string;
}

// Used to indicate the chart is being plotted across
// all partition field values, where the cardinality of the field cannot be
// obtained as it is not aggregatable e.g. 'all distinct kpi_indicator values'
const allValuesLabel = i18n.translate('xpack.ml.timeSeriesExplorer.allPartitionValuesLabel', {
  defaultMessage: 'all',
});

export const TimeseriesFunctionDescription: FC<{ entities: MlEntityField[] }> = ({ entities }) => (
  <EuiTextColor color={'success'} component={'span'}>
    {entities.map((countData, i) => {
      return (
        <Fragment key={countData.fieldName}>
          {i18n.translate('xpack.ml.timeSeriesExplorer.countDataInChartDetailsDescription', {
            defaultMessage:
              '{openBrace}{cardinalityValue} distinct {fieldName} {cardinality, plural, one {} other { values}}{closeBrace}',
            values: {
              openBrace: i === 0 ? '(' : '',
              closeBrace: i === entities.length - 1 ? ')' : '',
              cardinalityValue:
                countData.cardinality === 0 ? allValuesLabel : countData.cardinality,
              cardinality: countData.cardinality,
              fieldName: countData.fieldName,
            },
          })}
          {i !== entities.length - 1 ? ', ' : ''}
        </Fragment>
      );
    })}
  </EuiTextColor>
);

export const TimeseriesExplorerTitle: FC<Props> = ({
  entities,
  entityDataCount,
  functionLabel,
}) => {
  return (
    <EuiTitle size={'xs'}>
      <h2>
        <span>
          {i18n.translate('xpack.ml.timeSeriesExplorer.singleTimeSeriesAnalysisTitle', {
            defaultMessage: 'Single time series analysis of {functionLabel}',
            values: { functionLabel },
          })}
        </span>
        &nbsp;
        {entityDataCount === 1 && (
          <EuiTextColor color={'success'} component={'span'}>
            {entities.length && '('}
            {entities
              .map((entity) => {
                return `${entity.fieldName}: ${entity.fieldValue}`;
              })
              .join(', ')}
            {entities.length > 0 && ')'}
          </EuiTextColor>
        )}
        {entityDataCount !== 1 && <TimeseriesFunctionDescription entities={entities} />}
      </h2>
    </EuiTitle>
  );
};
