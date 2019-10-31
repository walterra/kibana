/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { Fragment, FC, useEffect, useState } from 'react';
import moment from 'moment-timezone';

import { i18n } from '@kbn/i18n';
import {
  EuiBadge,
  EuiButtonIcon,
  EuiCallOut,
  EuiCheckbox,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiPopover,
  EuiPopoverTitle,
  EuiProgress,
  EuiSpacer,
  EuiText,
  EuiTitle,
  EuiToolTip,
  Query,
} from '@elastic/eui';

import { Query as QueryType } from '../../../analytics_management/components/analytics_list/common';

import {
  ColumnType,
  MlInMemoryTableBasic,
  OnTableChangeArg,
  SortingPropType,
  SORT_DIRECTION,
} from '../../../../../components/ml_in_memory_table';

import { formatHumanReadableDateTimeSeconds } from '../../../../../util/date_utils';
import { SavedSearchQuery } from '../../../../../contexts/kibana';

import {
  sortRegressionResultsColumns,
  sortRegressionResultsFields,
  toggleSelectedField,
  DataFrameAnalyticsConfig,
  EsFieldName,
  EsDoc,
  MAX_COLUMNS,
  getPredictedFieldName,
  INDEX_STATUS,
} from '../../../../common';

import { useExploreData, defaultSearchQuery } from './use_explore_data';

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

const ExplorationTitle: React.SFC<{ jobId: string }> = ({ jobId }) => (
  <EuiTitle size="xs">
    <span>
      {i18n.translate('xpack.ml.dataframe.analytics.regressionExploration.jobIdTitle', {
        defaultMessage: 'Regression job ID {jobId}',
        values: { jobId },
      })}
    </span>
  </EuiTitle>
);

interface Props {
  jobConfig: DataFrameAnalyticsConfig;
}

export const ResultsTable: FC<Props> = React.memo(({ jobConfig }) => {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [clearTable, setClearTable] = useState(false);
  const [selectedFields, setSelectedFields] = useState([] as EsFieldName[]);
  const [isColumnsPopoverVisible, setColumnsPopoverVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState<SavedSearchQuery>(defaultSearchQuery);
  const [searchError, setSearchError] = useState<any>(undefined);
  const [searchString, setSearchString] = useState<string | undefined>(undefined);

  // EuiInMemoryTable has an issue with dynamic sortable columns
  // and will trigger a full page Kibana error in such a case.
  // The following is a workaround until this is solved upstream:
  // - If the sortable/columns config changes,
  //   the table will be unmounted/not rendered.
  //   This is what setClearTable(true) in toggleColumn() does.
  // - After that on next render it gets re-enabled. To make sure React
  //   doesn't consolidate the state updates, setTimeout is used.
  if (clearTable) {
    setTimeout(() => setClearTable(false), 0);
  }

  function toggleColumnsPopover() {
    setColumnsPopoverVisible(!isColumnsPopoverVisible);
  }

  function closeColumnsPopover() {
    setColumnsPopoverVisible(false);
  }

  function toggleColumn(column: EsFieldName) {
    if (tableItems.length > 0 && jobConfig !== undefined) {
      setClearTable(true);
      // spread to a new array otherwise the component wouldn't re-render
      setSelectedFields([...toggleSelectedField(selectedFields, column)]);
    }
  }

  const {
    errorMessage,
    loadExploreData,
    sortField,
    sortDirection,
    status,
    tableItems,
  } = useExploreData(jobConfig, selectedFields, setSelectedFields);

  let docFields: EsFieldName[] = [];
  let docFieldsCount = 0;
  if (tableItems.length > 0) {
    docFields = Object.keys(tableItems[0]);
    docFields.sort((a, b) => sortRegressionResultsFields(a, b, jobConfig));
    docFieldsCount = docFields.length;
  }

  const columns: ColumnType[] = [];

  if (jobConfig !== undefined && selectedFields.length > 0 && tableItems.length > 0) {
    columns.push(
      ...selectedFields.sort(sortRegressionResultsColumns(tableItems[0], jobConfig)).map(k => {
        const column: ColumnType = {
          field: k,
          name: k,
          sortable: true,
          truncateText: true,
        };

        const render = (d: any, fullItem: EsDoc) => {
          if (Array.isArray(d) && d.every(item => typeof item === 'string')) {
            // If the cells data is an array of strings, return as a comma separated list.
            // The list will get limited to 5 items with `…` at the end if there's more in the original array.
            return `${d.slice(0, 5).join(', ')}${d.length > 5 ? ', …' : ''}`;
          } else if (Array.isArray(d)) {
            // If the cells data is an array of e.g. objects, display a 'array' badge with a
            // tooltip that explains that this type of field is not supported in this table.
            return (
              <EuiToolTip
                content={i18n.translate(
                  'xpack.ml.dataframe.analytics.regressionExploration.indexArrayToolTipContent',
                  {
                    defaultMessage:
                      'The full content of this array based column cannot be displayed.',
                  }
                )}
              >
                <EuiBadge>
                  {i18n.translate(
                    'xpack.ml.dataframe.analytics.regressionExploration.indexArrayBadgeContent',
                    {
                      defaultMessage: 'array',
                    }
                  )}
                </EuiBadge>
              </EuiToolTip>
            );
          } else if (typeof d === 'object' && d !== null) {
            // If the cells data is an object, display a 'object' badge with a
            // tooltip that explains that this type of field is not supported in this table.
            return (
              <EuiToolTip
                content={i18n.translate(
                  'xpack.ml.dataframe.analytics.regressionExploration.indexObjectToolTipContent',
                  {
                    defaultMessage:
                      'The full content of this object based column cannot be displayed.',
                  }
                )}
              >
                <EuiBadge>
                  {i18n.translate(
                    'xpack.ml.dataframe.analytics.regressionExploration.indexObjectBadgeContent',
                    {
                      defaultMessage: 'object',
                    }
                  )}
                </EuiBadge>
              </EuiToolTip>
            );
          }

          return d;
        };

        let columnType;

        if (tableItems.length > 0) {
          columnType = typeof tableItems[0][k];
        }

        if (typeof columnType !== 'undefined') {
          switch (columnType) {
            case 'boolean':
              column.dataType = 'boolean';
              break;
            case 'Date':
              column.align = 'right';
              column.render = (d: any) =>
                formatHumanReadableDateTimeSeconds(moment(d).unix() * 1000);
              break;
            case 'number':
              column.dataType = 'number';
              column.render = render;
              break;
            default:
              column.render = render;
              break;
          }
        } else {
          column.render = render;
        }

        return column;
      })
    );
  }

  useEffect(() => {
    if (jobConfig !== undefined) {
      const predictedFieldName = getPredictedFieldName(
        jobConfig.dest.results_field,
        jobConfig.analysis
      );
      const predictedFieldSelected = selectedFields.includes(predictedFieldName);

      const field = predictedFieldSelected ? predictedFieldName : selectedFields[0];
      const direction = predictedFieldSelected ? SORT_DIRECTION.DESC : SORT_DIRECTION.ASC;
      loadExploreData({ field, direction, searchQuery });
      return;
    }
  }, [JSON.stringify(searchQuery)]);

  useEffect(() => {
    // by default set the sorting to descending on the prediction field (`<dependent_varible or prediction_field_name>_prediction`).
    // if that's not available sort ascending on the first column.
    // also check if the current sorting field is still available.
    if (jobConfig !== undefined && columns.length > 0 && !selectedFields.includes(sortField)) {
      const predictedFieldName = getPredictedFieldName(
        jobConfig.dest.results_field,
        jobConfig.analysis
      );
      const predictedFieldSelected = selectedFields.includes(predictedFieldName);

      const field = predictedFieldSelected ? predictedFieldName : selectedFields[0];
      const direction = predictedFieldSelected ? SORT_DIRECTION.DESC : SORT_DIRECTION.ASC;
      loadExploreData({ field, direction, searchQuery });
      return;
    }
  }, [jobConfig, columns.length, sortField, sortDirection, tableItems.length]);

  let sorting: SortingPropType = false;
  let onTableChange;

  if (columns.length > 0 && sortField !== '' && sortField !== undefined) {
    sorting = {
      sort: {
        field: sortField,
        direction: sortDirection,
      },
    };

    onTableChange = ({
      page = { index: 0, size: 10 },
      sort = { field: sortField, direction: sortDirection },
    }: OnTableChangeArg) => {
      const { index, size } = page;
      setPageIndex(index);
      setPageSize(size);

      if (sort.field !== sortField || sort.direction !== sortDirection) {
        setClearTable(true);
        loadExploreData({ ...sort, searchQuery });
      }
    };
  }

  const pagination = {
    initialPageIndex: pageIndex,
    initialPageSize: pageSize,
    totalItemCount: tableItems.length,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    hidePerPageOptions: false,
  };

  const onQueryChange = ({ query, error }: { query: QueryType; error: any }) => {
    if (error) {
      setSearchError(error.message);
    } else {
      try {
        const esQueryDsl = Query.toESQuery(query);
        setSearchQuery(esQueryDsl);
        setSearchString(query.text);
        setSearchError(undefined);
      } catch (e) {
        setSearchError(e.toString());
      }
    }
  };

  const search = {
    onChange: onQueryChange,
    defaultQuery: searchString,
    box: {
      incremental: false,
      placeholder: i18n.translate(
        'xpack.ml.dataframe.analytics.regressionExploration.searchBoxPlaceholder',
        {
          defaultMessage: 'E.g. avg>0.5',
        }
      ),
    },
    filters: [
      {
        type: 'field_value_toggle_group',
        field: `${jobConfig.dest.results_field}.is_training`,
        items: [
          {
            value: false,
            name: i18n.translate(
              'xpack.ml.dataframe.analytics.regressionExploration.isTestingLabel',
              {
                defaultMessage: 'Testing',
              }
            ),
          },
          {
            value: true,
            name: i18n.translate(
              'xpack.ml.dataframe.analytics.regressionExploration.isTrainingLabel',
              {
                defaultMessage: 'Training',
              }
            ),
          },
        ],
      },
    ],
  };

  if (jobConfig === undefined) {
    return null;
  }

  if (status === INDEX_STATUS.ERROR) {
    return (
      <EuiPanel grow={false}>
        <ExplorationTitle jobId={jobConfig.id} />
        <EuiCallOut
          title={i18n.translate('xpack.ml.dataframe.analytics.regressionExploration.indexError', {
            defaultMessage: 'An error occurred loading the index data.',
          })}
          color="danger"
          iconType="cross"
        >
          <p>{errorMessage}</p>
        </EuiCallOut>
      </EuiPanel>
    );
  }

  return (
    <EuiPanel grow={false}>
      <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" responsive={false}>
        <EuiFlexItem grow={false}>
          <ExplorationTitle jobId={jobConfig.id} />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiFlexGroup alignItems="center" gutterSize="xs" responsive={false}>
            <EuiFlexItem style={{ textAlign: 'right' }}>
              {docFieldsCount > MAX_COLUMNS && (
                <EuiText size="s">
                  {i18n.translate(
                    'xpack.ml.dataframe.analytics.regressionExploration.fieldSelection',
                    {
                      defaultMessage:
                        '{selectedFieldsLength, number} of {docFieldsCount, number} {docFieldsCount, plural, one {field} other {fields}} selected',
                      values: { selectedFieldsLength: selectedFields.length, docFieldsCount },
                    }
                  )}
                </EuiText>
              )}
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiText size="s">
                <EuiPopover
                  id="popover"
                  button={
                    <EuiButtonIcon
                      iconType="gear"
                      onClick={toggleColumnsPopover}
                      aria-label={i18n.translate(
                        'xpack.ml.dataframe.analytics.regressionExploration.selectColumnsAriaLabel',
                        {
                          defaultMessage: 'Select columns',
                        }
                      )}
                    />
                  }
                  isOpen={isColumnsPopoverVisible}
                  closePopover={closeColumnsPopover}
                  ownFocus
                >
                  <EuiPopoverTitle>
                    {i18n.translate(
                      'xpack.ml.dataframe.analytics.regressionExploration.selectFieldsPopoverTitle',
                      {
                        defaultMessage: 'Select fields',
                      }
                    )}
                  </EuiPopoverTitle>
                  <div style={{ maxHeight: '400px', overflowY: 'scroll' }}>
                    {docFields.map(d => (
                      <EuiCheckbox
                        key={d}
                        id={d}
                        label={d}
                        checked={selectedFields.includes(d)}
                        onChange={() => toggleColumn(d)}
                        disabled={selectedFields.includes(d) && selectedFields.length === 1}
                      />
                    ))}
                  </div>
                </EuiPopover>
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
      {status === INDEX_STATUS.LOADING && <EuiProgress size="xs" color="accent" />}
      {status !== INDEX_STATUS.LOADING && (
        <EuiProgress size="xs" color="accent" max={1} value={0} />
      )}
      {clearTable === false && (columns.length > 0 || searchQuery !== defaultSearchQuery) && (
        <Fragment>
          <EuiSpacer />
          <MlInMemoryTableBasic
            allowNeutralSort={false}
            columns={columns}
            compressed
            hasActions={false}
            isSelectable={false}
            items={tableItems}
            onTableChange={onTableChange}
            pagination={pagination}
            responsive={false}
            search={search}
            error={searchError}
            sorting={sorting}
          />
        </Fragment>
      )}
    </EuiPanel>
  );
});
