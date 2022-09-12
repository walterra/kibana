/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { FC, useCallback, useMemo, useState } from 'react';
import { sortBy } from 'lodash';

import {
  // EuiBadge,
  EuiBasicTable,
  EuiBasicTableColumn,
  EuiButtonIcon,
  EuiCodeBlock,
  EuiDescriptionList,
  // EuiIcon,
  EuiScreenReaderOnly,
  EuiTableSortingType,
  // EuiToolTip,
  RIGHT_ALIGNMENT,
} from '@elastic/eui';

import { i18n } from '@kbn/i18n';
// import { FormattedMessage } from '@kbn/i18n-react';
import { escapeKuery } from '@kbn/es-query';
import type { ChangePoint } from '@kbn/ml-agg-utils';
import { SEARCH_QUERY_LANGUAGE } from '../../application/utils/search_utils';
import { useEuiTheme } from '../../hooks/use_eui_theme';
import { useAiopsAppContext } from '../../hooks/use_aiops_app_context';
// import { MiniHistogram } from '../mini_histogram';
// import { getFailedTransactionsCorrelationImpactLabel } from './get_failed_transactions_correlation_impact_label';

// const NARROW_COLUMN_WIDTH = '120px';
// const ACTIONS_COLUMN_WIDTH = '60px';

const PAGINATION_SIZE_OPTIONS = [5, 10, 20, 50];
const DEFAULT_SORT_FIELD = 'docCount';
const DEFAULT_SORT_DIRECTION = 'desc';
// const viewInDiscoverMessage = i18n.translate(
//   'xpack.aiops.spikeAnalysisTable.linksMenu.viewInDiscover',
//   {
//     defaultMessage: 'View in Discover',
//   }
// );

interface GroupTableItem {
  id: number;
  docCount: number;
  group: Record<string, any>;
  repeatedValues: Record<string, any>;
}

interface SpikeAnalysisTableProps {
  changePoints: ChangePoint[];
  groupTableItems: GroupTableItem[];
  dataViewId?: string;
  loading: boolean;
  onPinnedChangePoint?: (changePoint: ChangePoint | null) => void;
  onSelectedChangePoint?: (changePoint: ChangePoint | null) => void;
  selectedChangePoint?: ChangePoint;
}

export const SpikeAnalysisGroupsTable: FC<SpikeAnalysisTableProps> = ({
  changePoints,
  groupTableItems,
  dataViewId,
  loading,
  onPinnedChangePoint,
  onSelectedChangePoint,
  selectedChangePoint,
}) => {
  // @ts-ignore
  const euiTheme = useEuiTheme();

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<keyof GroupTableItem>(DEFAULT_SORT_FIELD);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(DEFAULT_SORT_DIRECTION);
  const [itemIdToExpandedRowMap, setItemIdToExpandedRowMap] = useState({});

  const { application, share, data } = useAiopsAppContext();

  const discoverLocator = useMemo(
    () => share.url.locators.get('DISCOVER_APP_LOCATOR'),
    [share.url.locators]
  );

  // @ts-ignore
  const discoverUrlError = useMemo(() => {
    if (!application.capabilities.discover?.show) {
      const discoverNotEnabled = i18n.translate(
        'xpack.aiops.spikeAnalysisTable.discoverNotEnabledErrorMessage',
        {
          defaultMessage: 'Discover is not enabled',
        }
      );

      return discoverNotEnabled;
    }
    if (!discoverLocator) {
      const discoverLocatorMissing = i18n.translate(
        'xpack.aiops.spikeAnalysisTable.discoverLocatorMissingErrorMessage',
        {
          defaultMessage: 'No locator for Discover detected',
        }
      );

      return discoverLocatorMissing;
    }
    if (!dataViewId) {
      const autoGeneratedDiscoverLinkError = i18n.translate(
        'xpack.aiops.spikeAnalysisTable.autoGeneratedDiscoverLinkErrorMessage',
        {
          defaultMessage: 'Unable to link to Discover; no data view exists for this index',
        }
      );

      return autoGeneratedDiscoverLinkError;
    }
  }, [application.capabilities.discover?.show, dataViewId, discoverLocator]);
  // @ts-ignore
  const generateDiscoverUrl = async (changePoint: ChangePoint) => {
    if (discoverLocator !== undefined) {
      const url = await discoverLocator.getRedirectUrl({
        indexPatternId: dataViewId,
        timeRange: data.query.timefilter.timefilter.getTime(),
        filters: data.query.filterManager.getFilters(),
        query: {
          language: SEARCH_QUERY_LANGUAGE.KUERY,
          query: `${escapeKuery(changePoint.fieldName)}:${escapeKuery(
            String(changePoint.fieldValue)
          )}`,
        },
      });

      return url;
    }
  };

  const toggleDetails = (item: GroupTableItem) => {
    const itemIdToExpandedRowMapValues = { ...itemIdToExpandedRowMap };
    // @ts-ignore
    if (itemIdToExpandedRowMapValues[item.id]) {
      // @ts-ignore
      delete itemIdToExpandedRowMapValues[item.id];
    } else {
      const { group, repeatedValues } = item;

      const listItems = [];
      const fullGroup = { ...group, ...repeatedValues };

      for (const fieldName in fullGroup) {
        listItems.push({
          title: `${fieldName}`,
          description: `${fullGroup[fieldName]}`,
        });
      }
      // @ts-ignore
      itemIdToExpandedRowMapValues[item.id] = <EuiDescriptionList listItems={listItems} />;
    }
    setItemIdToExpandedRowMap(itemIdToExpandedRowMapValues);
  };

  const columns: Array<EuiBasicTableColumn<GroupTableItem>> = [
    {
      align: RIGHT_ALIGNMENT,
      width: '40px',
      isExpander: true,
      name: (
        <EuiScreenReaderOnly>
          <span>Expand rows</span>
        </EuiScreenReaderOnly>
      ),
      render: (item: GroupTableItem) => (
        <EuiButtonIcon
          onClick={() => toggleDetails(item)}
          // @ts-ignore
          aria-label={itemIdToExpandedRowMap[item.id] ? 'Collapse' : 'Expand'}
          // @ts-ignore
          iconType={itemIdToExpandedRowMap[item.id] ? 'arrowUp' : 'arrowDown'}
        />
      ),
    },
    {
      'data-test-subj': 'aiopsSpikeAnalysisTableColumnGroup',
      field: 'group',
      name: i18n.translate(
        'xpack.aiops.correlations.failedTransactions.correlationsTable.groupLabel',
        { defaultMessage: 'Group' }
      ),
      // @ts-ignore
      render: (_, { group }) => (
        <EuiCodeBlock
          aria-label={i18n.translate('xpack.aiops.correlations.correlationsTable.groupJsonPane', {
            defaultMessage: 'JSON of groups',
          })}
          style={{ width: '100%' }}
          language="json"
          fontSize="s"
          paddingSize="s"
          isCopyable
          data-test-subj={`aiopsSpikeAnalysisTableColumnGroupJSON`}
        >
          {JSON.stringify(group, null, 2)}
        </EuiCodeBlock>
      ),
      sortable: false,
    },
    {
      'data-test-subj': 'aiopsSpikeAnalysisTableColumnDocCount',
      field: 'docCount',
      name: i18n.translate('xpack.aiops.correlations.correlationsTable.docCountLabel', {
        defaultMessage: 'Doc count',
      }),
      sortable: true,
      width: '20%',
    },
  ];

  const onChange = useCallback((tableSettings) => {
    const { index, size } = tableSettings.page;
    const { field, direction } = tableSettings.sort;

    setPageIndex(index);
    setPageSize(size);
    setSortField(field);
    setSortDirection(direction);
  }, []);

  const { pagination, pageOfItems, sorting } = useMemo(() => {
    const pageStart = pageIndex * pageSize;
    const itemCount = groupTableItems?.length ?? 0;

    let items = groupTableItems ?? [];
    items = sortBy(groupTableItems, (item) => {
      if (item && typeof item[sortField] === 'string') {
        // @ts-ignore Object is possibly null or undefined
        return item[sortField].toLowerCase();
      }
      return item[sortField];
    });
    items = sortDirection === 'asc' ? items : items.reverse();

    return {
      pageOfItems: items.slice(pageStart, pageStart + pageSize),
      pagination: {
        pageIndex,
        pageSize,
        totalItemCount: itemCount,
        pageSizeOptions: PAGINATION_SIZE_OPTIONS,
      },
      sorting: {
        sort: {
          field: sortField,
          direction: sortDirection,
        },
      },
    };
  }, [pageIndex, pageSize, sortField, sortDirection, groupTableItems]);

  // Don't pass on the `loading` state to the table itself because
  // it disables hovering events. Because the mini histograms take a while
  // to load, hovering would not update the main chart. Instead,
  // the loading state is shown by the progress bar on the outer component level.
  // The outer component also will display a prompt when no data was returned
  // running the analysis and will hide this table.

  return (
    <EuiBasicTable
      data-test-subj="aiopsSpikeAnalysisTable"
      compressed
      columns={columns}
      items={pageOfItems}
      itemIdToExpandedRowMap={itemIdToExpandedRowMap}
      onChange={onChange}
      pagination={pagination}
      loading={false}
      sorting={sorting as EuiTableSortingType<GroupTableItem>}
    />
  );
};
