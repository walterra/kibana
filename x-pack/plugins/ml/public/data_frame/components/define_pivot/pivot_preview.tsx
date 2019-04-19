/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { useContext } from 'react';

import { i18n } from '@kbn/i18n';

import {
  EuiCallOut,
  EuiInMemoryTable,
  EuiPanel,
  EuiProgress,
  EuiTitle,
  SortDirection,
} from '@elastic/eui';

import { IndexPatternContext, OptionsDataElement, SimpleQuery } from '../../common';
import { PIVOT_PREVIEW_STATUS, usePivotPreviewData } from './use_pivot_preview_data';

interface Props {
  aggs: OptionsDataElement[];
  groupBy: string[];
  query: SimpleQuery;
}

export const PivotPreview: React.SFC<Props> = React.memo(({ aggs, groupBy, query }) => {
  const indexPattern = useContext(IndexPatternContext);

  if (indexPattern === null) {
    return null;
  }

  const { dataFramePreviewData, errorMessage, status } = usePivotPreviewData(
    indexPattern,
    query,
    aggs,
    groupBy
  );

  if (status === PIVOT_PREVIEW_STATUS.ERROR) {
    return (
      <EuiPanel grow={false}>
        <EuiTitle size="xs">
          <span>
            {i18n.translate('xpack.ml.dataframe.pivotPreview.dataFramePivotPreviewTitle', {
              defaultMessage: 'Data Frame Pivot Preview',
            })}
          </span>
        </EuiTitle>
        <EuiCallOut
          title={i18n.translate(
            'xpack.ml.dataframe.sourceIndexPreview.dataFramePivotPreviewError',
            {
              defaultMessage: 'An error occurred loading the pivot preview.',
            }
          )}
          color="danger"
          iconType="cross"
        >
          <p>{errorMessage}</p>
        </EuiCallOut>
      </EuiPanel>
    );
  }

  if (dataFramePreviewData.length === 0) {
    return (
      <EuiPanel grow={false}>
        <EuiTitle size="xs">
          <span>
            {i18n.translate('xpack.ml.dataframe.pivotPreview.dataFramePivotPreviewTitle', {
              defaultMessage: 'Data Frame Pivot Preview',
            })}
          </span>
        </EuiTitle>
        <EuiCallOut
          title={i18n.translate(
            'xpack.ml.dataframe.sourceIndexPreview.dataFramePivotPreviewNoDataCalloutTitle',
            {
              defaultMessage: 'Pivot Preview not available',
            }
          )}
          color="primary"
        >
          <p>
            {i18n.translate(
              'xpack.ml.dataframe.sourceIndexPreview.dataFramePivotPreviewNoDataCalloutBody',
              {
                defaultMessage:
                  'Please make sure to choose at least one group-by field and aggregation.',
              }
            )}
          </p>
        </EuiCallOut>
      </EuiPanel>
    );
  }

  const columnKeys = Object.keys(dataFramePreviewData[0]);
  columnKeys.sort((a, b) => {
    // make sure groupBy fields are always most left columns
    if (groupBy.some(d => d === a) && groupBy.some(d => d === b)) {
      return a.localeCompare(b);
    }
    if (groupBy.some(d => d === a)) {
      return -1;
    }
    if (groupBy.some(d => d === b)) {
      return 1;
    }
    return a.localeCompare(b);
  });

  const columns = columnKeys.map(k => {
    return {
      field: k,
      name: k,
      sortable: true,
      truncateText: true,
    };
  });

  const sorting = {
    sort: {
      field: columns[0].field,
      direction: SortDirection.ASC,
    },
  };

  return (
    <EuiPanel>
      <EuiTitle size="xs">
        <span>
          {i18n.translate('xpack.ml.dataframe.pivotPreview.dataFramePivotPreviewTitle', {
            defaultMessage: 'Data Frame Pivot Preview',
          })}
        </span>
      </EuiTitle>
      {status === PIVOT_PREVIEW_STATUS.LOADING && <EuiProgress size="xs" color="accent" />}
      {status !== PIVOT_PREVIEW_STATUS.LOADING && (
        <EuiProgress size="xs" color="accent" max={1} value={0} />
      )}
      {dataFramePreviewData.length > 0 && (
        <EuiInMemoryTable
          items={dataFramePreviewData}
          columns={columns}
          pagination={true}
          sorting={sorting}
        />
      )}
    </EuiPanel>
  );
});
