/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useEffect, useMemo, FC } from 'react';
import { merge } from 'rxjs';
import { useSelector } from 'react-redux';

import {
  EuiButton,
  EuiButtonIcon,
  EuiCopy,
  EuiFlexGroup,
  EuiFlexItem,
  EuiForm,
  EuiFormRow,
  EuiIconTip,
  EuiLink,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';

import { i18n } from '@kbn/i18n';
import { DataGrid } from '@kbn/ml-data-grid';
import {
  mlTimefilterRefresh$,
  useTimefilter,
  DatePickerWrapper,
  FullTimeRangeSelector,
  FROZEN_TIER_PREFERENCE,
} from '@kbn/ml-date-picker';
import { useStorage } from '@kbn/ml-local-storage';
import { useUrlState } from '@kbn/ml-url-state';
import { XJson } from '@kbn/es-ui-shared-plugin/public';

import { PivotAggDict } from '../../../../../../common/types/pivot_aggs';
import { PivotGroupByDict } from '../../../../../../common/types/pivot_group_by';
import { TRANSFORM_FUNCTION } from '../../../../../../common/constants';
import {
  TRANSFORM_FROZEN_TIER_PREFERENCE,
  type TransformStorageKey,
  type TransformStorageMapped,
} from '../../../../../../common/types/storage';

import {
  getIndexDevConsoleStatement,
  getTransformPreviewDevConsoleStatement,
} from '../../../../common/data_grid';
import {
  PivotAggsConfigDict,
  PivotGroupByConfigDict,
  PivotSupportedGroupByAggs,
  PivotAggsConfig,
} from '../../../../common';
import { useDocumentationLinks } from '../../../../hooks/use_documentation_links';
import { useIndexData } from '../../../../hooks/use_index_data';
import { useTransformConfigData } from '../../../../hooks/use_transform_config_data';
import { useAppDependencies, useToastNotifications } from '../../../../app_dependencies';
import { getAggConfigFromEsAgg } from '../../../../common/pivot_aggs';

import { useWizardContext } from '../wizard/wizard';
import { useWizardActions, useWizardSelector } from '../../state_management/create_transform_store';
import {
  selectCopyToClipboardPreviewRequest,
  selectPivotValidationStatus,
  selectRequestPayload,
  selectTransformConfigQuery,
} from '../../state_management/step_define_selectors';

import { AdvancedQueryEditorSwitch } from '../advanced_query_editor_switch';
import { AdvancedSourceEditor } from '../advanced_source_editor';
import { DatePickerApplySwitch } from '../date_picker_apply_switch';
import { SourceSearchBar } from '../source_search_bar';
import { AdvancedRuntimeMappingsSettings } from '../advanced_runtime_mappings_settings';

import { useStepDefineForm } from './hooks/use_step_define_form';
import { TransformFunctionSelector } from './transform_function_selector';
import { LatestFunctionForm } from './latest_function_form';
import { PivotFunctionForm } from './pivot_function_form';

const { collapseLiteralStrings } = XJson;

const ALLOW_TIME_RANGE_ON_TRANSFORM_CONFIG = false;

const advancedEditorsSidebarWidth = '220px';

type PopulatedFields = Set<string>;
const isPopulatedFields = (arg: unknown): arg is PopulatedFields => arg instanceof Set;

export const ConfigSectionTitle: FC<{ title: string }> = ({ title }) => (
  <>
    <EuiSpacer size="m" />
    <EuiTitle size="xs">
      <span>{title}</span>
    </EuiTitle>
    <EuiSpacer size="s" />
  </>
);

export const StepDefineForm: FC = () => {
  const [globalState, setGlobalState] = useUrlState('_g');
  const { searchItems } = useWizardContext();
  const { dataView } = searchItems;
  const indexPattern = useMemo(() => dataView.getIndexPattern(), [dataView]);
  const [frozenDataPreference, setFrozenDataPreference] = useStorage<
    TransformStorageKey,
    TransformStorageMapped<typeof TRANSFORM_FROZEN_TIER_PREFERENCE>
  >(
    TRANSFORM_FROZEN_TIER_PREFERENCE,
    // By default we will exclude frozen data tier
    FROZEN_TIER_PREFERENCE.EXCLUDE
  );
  const toastNotifications = useToastNotifications();
  const stepDefineForm = useStepDefineForm();
  const advancedEditorConfig = useWizardSelector((s) => s.advancedPivotEditor.advancedEditorConfig);
  const isAdvancedSourceEditorEnabled = useWizardSelector(
    (s) => s.stepDefine.isAdvancedSourceEditorEnabled
  );
  const timeRangeMs = useWizardSelector((s) => s.stepDefine.timeRangeMs);
  const transformFunction = useWizardSelector((s) => s.stepDefine.transformFunction);
  const runtimeMappings = useWizardSelector((s) => s.stepDefine.runtimeMappings);
  const transformConfigQuery = useSelector(selectTransformConfigQuery);
  const {
    setAdvancedEditorConfigLastApplied,
    setAdvancedPivotEditorApplyButtonEnabled,
    setAggList,
    setGroupByList,
    setSearchQuery,
  } = useWizardActions();

  const { advancedEditorSourceConfig, isAdvancedSourceEditorApplyButtonEnabled } =
    stepDefineForm.advancedSourceEditor.state;

  const appDependencies = useAppDependencies();
  const {
    ml: { useFieldStatsFlyoutContext },
  } = appDependencies;

  const fieldStatsContext = useFieldStatsFlyoutContext();
  const indexPreviewProps = {
    ...useIndexData(
      dataView,
      transformConfigQuery,
      runtimeMappings,
      timeRangeMs,
      isPopulatedFields(fieldStatsContext?.populatedFields)
        ? [...fieldStatsContext.populatedFields]
        : []
    ),
    dataTestSubj: 'transformIndexPreview',
    toastNotifications,
  };

  const pivotRequestPayload = useSelector(selectRequestPayload);
  const pivotValidationStatus = useSelector(selectPivotValidationStatus);

  const { requestPayload, validationStatus } =
    transformFunction === TRANSFORM_FUNCTION.PIVOT
      ? { requestPayload: pivotRequestPayload, validationStatus: pivotValidationStatus }
      : stepDefineForm.latestFunctionConfig;

  const copyToClipboardSource = getIndexDevConsoleStatement(transformConfigQuery, indexPattern);
  const copyToClipboardSourceDescription = i18n.translate(
    'xpack.transform.indexPreview.copyClipboardTooltip',
    {
      defaultMessage: 'Copy Dev Console statement of the index preview to the clipboard.',
    }
  );

  const copyToClipboardPreviewRequest = useWizardSelector((state) =>
    selectCopyToClipboardPreviewRequest(state, dataView)
  );

  const copyToClipboardPivot = getTransformPreviewDevConsoleStatement(
    copyToClipboardPreviewRequest
  );
  const copyToClipboardPivotDescription = i18n.translate(
    'xpack.transform.pivotPreview.copyClipboardTooltip',
    {
      defaultMessage: 'Copy Dev Console statement of the transform preview to the clipboard.',
    }
  );

  const previewProps = {
    ...useTransformConfigData(
      dataView,
      transformConfigQuery,
      validationStatus,
      requestPayload,
      runtimeMappings,
      timeRangeMs
    ),
    dataTestSubj: 'transformPivotPreview',
    toastNotifications,
    ...(transformFunction === TRANSFORM_FUNCTION.LATEST
      ? {
          copyToClipboard: copyToClipboardPivot,
          copyToClipboardDescription: copyToClipboardPivotDescription,
        }
      : {}),
  };

  const applySourceChangesHandler = () => {
    const sourceConfig = JSON.parse(advancedEditorSourceConfig);
    setSearchQuery(sourceConfig);
    stepDefineForm.advancedSourceEditor.actions.applyAdvancedSourceEditorChanges();
  };

  const applyPivotChangesHandler = () => {
    const pivot = JSON.parse(collapseLiteralStrings(advancedEditorConfig));

    const newGroupByList: PivotGroupByConfigDict = {};
    if (pivot !== undefined && pivot.group_by !== undefined) {
      Object.entries(pivot.group_by).forEach((d) => {
        const aggName = d[0];
        const aggConfig = d[1] as PivotGroupByDict;
        const aggConfigKeys = Object.keys(aggConfig);
        const agg = aggConfigKeys[0] as PivotSupportedGroupByAggs;
        newGroupByList[aggName] = {
          ...aggConfig[agg],
          agg,
          aggName,
          dropDownName: '',
        };
      });
    }
    setGroupByList(newGroupByList);

    const newAggList: PivotAggsConfigDict = {};
    if (pivot !== undefined && pivot.aggregations !== undefined) {
      Object.entries(pivot.aggregations).forEach((d) => {
        const aggName = d[0];
        const aggConfig = d[1] as PivotAggDict;

        newAggList[aggName] = getAggConfigFromEsAgg(aggConfig, aggName) as PivotAggsConfig;
      });
    }
    setAggList(newAggList);

    setAdvancedEditorConfigLastApplied(advancedEditorConfig);
    setAdvancedPivotEditorApplyButtonEnabled(false);
  };

  const { esQueryDsl } = useDocumentationLinks();

  const hasValidTimeField = useMemo(
    () => dataView.timeFieldName !== undefined && dataView.timeFieldName !== '',
    [dataView.timeFieldName]
  );

  const timefilter = useTimefilter({
    timeRangeSelector: dataView?.timeFieldName !== undefined,
    autoRefreshSelector: false,
  });

  useEffect(() => {
    if (globalState?.time !== undefined) {
      timefilter.setTime({
        from: globalState.time.from,
        to: globalState.time.to,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(globalState?.time), timefilter]);

  useEffect(() => {
    if (globalState?.refreshInterval !== undefined) {
      timefilter.setRefreshInterval(globalState.refreshInterval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(globalState?.refreshInterval), timefilter]);

  useEffect(() => {
    const timeUpdateSubscription = merge(
      timefilter.getAutoRefreshFetch$(),
      timefilter.getTimeUpdate$(),
      mlTimefilterRefresh$
    ).subscribe(() => {
      if (setGlobalState) {
        setGlobalState({
          time: timefilter.getTime(),
          refreshInterval: timefilter.getRefreshInterval(),
        });
      }
    });
    return () => {
      timeUpdateSubscription.unsubscribe();
    };
  });

  return (
    <div data-test-subj="transformStepDefineForm">
      <EuiForm>
        <EuiFormRow fullWidth>
          <TransformFunctionSelector />
        </EuiFormRow>

        <ConfigSectionTitle title="Source data" />

        {searchItems.savedSearch === undefined && (
          <EuiFormRow
            label={i18n.translate('xpack.transform.stepDefineForm.dataViewLabel', {
              defaultMessage: 'Data view',
            })}
          >
            <span>{indexPattern}</span>
          </EuiFormRow>
        )}

        {hasValidTimeField && (
          <EuiFormRow
            fullWidth
            label={
              <>
                {i18n.translate('xpack.transform.stepDefineForm.datePickerLabel', {
                  defaultMessage: 'Time range',
                })}{' '}
                <EuiIconTip
                  content={i18n.translate(
                    'xpack.transform.stepDefineForm.datePickerIconTipContent',
                    {
                      defaultMessage:
                        'The time range is applied to previews only and will not be part of the final transform configuration.',
                    }
                  )}
                />
              </>
            }
          >
            <EuiFlexGroup alignItems="flexStart" justifyContent="spaceBetween">
              {/* Flex Column #1: Date Picker */}
              <EuiFlexItem>
                <DatePickerWrapper
                  isAutoRefreshOnly={!hasValidTimeField}
                  showRefresh={!hasValidTimeField}
                  width="full"
                />
              </EuiFlexItem>
              {/* Flex Column #2: Apply-To-Config option */}
              <EuiFlexItem grow={false} style={{ width: advancedEditorsSidebarWidth }}>
                {ALLOW_TIME_RANGE_ON_TRANSFORM_CONFIG && (
                  <EuiFlexGroup alignItems="center" justifyContent="spaceBetween">
                    <EuiFlexItem grow={false}>
                      {searchItems.savedSearch === undefined && (
                        <DatePickerApplySwitch {...stepDefineForm} />
                      )}
                    </EuiFlexItem>
                  </EuiFlexGroup>
                )}
                <FullTimeRangeSelector
                  frozenDataPreference={frozenDataPreference}
                  setFrozenDataPreference={setFrozenDataPreference}
                  dataView={dataView}
                  query={undefined}
                  disabled={false}
                  timefilter={timefilter}
                />
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFormRow>
        )}

        <EuiFormRow
          fullWidth
          label={
            searchItems?.savedSearch?.id !== undefined
              ? i18n.translate('xpack.transform.stepDefineForm.savedSearchLabel', {
                  defaultMessage: 'Saved search',
                })
              : i18n.translate('xpack.transform.stepDefineForm.searchFilterLabel', {
                  defaultMessage: 'Search filter',
                })
          }
        >
          <>
            <EuiFlexGroup alignItems="flexStart" justifyContent="spaceBetween">
              <EuiFlexItem>
                {/* Flex Column #1: Search Bar / Advanced Search Editor */}
                {searchItems.savedSearch === undefined && (
                  <>
                    {!isAdvancedSourceEditorEnabled && (
                      <SourceSearchBar dataView={dataView} searchBar={stepDefineForm.searchBar} />
                    )}
                    {isAdvancedSourceEditorEnabled && <AdvancedSourceEditor {...stepDefineForm} />}
                  </>
                )}
                {searchItems?.savedSearch?.id !== undefined && (
                  <span>{searchItems.savedSearch.title}</span>
                )}
              </EuiFlexItem>

              {/* Search options: Advanced Editor Switch / Copy to Clipboard / Advanced Editor Apply Button */}
              <EuiFlexItem grow={false} style={{ width: advancedEditorsSidebarWidth }}>
                <EuiFlexGroup gutterSize="xs" direction="column" justifyContent="spaceBetween">
                  <EuiFlexItem grow={false}>
                    <EuiFlexGroup alignItems="center" justifyContent="spaceBetween">
                      <EuiFlexItem grow={false}>
                        {searchItems.savedSearch === undefined && (
                          <AdvancedQueryEditorSwitch {...stepDefineForm} />
                        )}
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiCopy
                          beforeMessage={copyToClipboardSourceDescription}
                          textToCopy={copyToClipboardSource}
                        >
                          {(copy: () => void) => (
                            <EuiButtonIcon
                              onClick={copy}
                              iconType="copyClipboard"
                              aria-label={copyToClipboardSourceDescription}
                            />
                          )}
                        </EuiCopy>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiFlexItem>
                  {isAdvancedSourceEditorEnabled && (
                    <EuiFlexItem style={{ width: advancedEditorsSidebarWidth }}>
                      <EuiSpacer size="s" />
                      <EuiText size="xs">
                        {i18n.translate(
                          'xpack.transform.stepDefineForm.advancedSourceEditorHelpText',
                          {
                            defaultMessage:
                              'The advanced editor allows you to edit the source query clause of the transform configuration.',
                          }
                        )}
                        <EuiLink href={esQueryDsl} target="_blank">
                          {i18n.translate(
                            'xpack.transform.stepDefineForm.advancedEditorHelpTextLink',
                            {
                              defaultMessage: 'Learn more about available options.',
                            }
                          )}
                        </EuiLink>
                      </EuiText>
                      <EuiSpacer size="s" />
                      <EuiButton
                        style={{ width: 'fit-content' }}
                        size="s"
                        fill
                        onClick={applySourceChangesHandler}
                        disabled={!isAdvancedSourceEditorApplyButtonEnabled}
                      >
                        {i18n.translate(
                          'xpack.transform.stepDefineForm.advancedSourceEditorApplyButtonText',
                          {
                            defaultMessage: 'Apply changes',
                          }
                        )}
                      </EuiButton>
                    </EuiFlexItem>
                  )}
                </EuiFlexGroup>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiSpacer size="s" />
            <AdvancedRuntimeMappingsSettings {...stepDefineForm} />
            <EuiSpacer size="s" />

            <EuiFormRow
              fullWidth={true}
              label={i18n.translate('xpack.transform.stepDefineForm.dataGridLabel', {
                defaultMessage: 'Source documents',
              })}
            >
              <DataGrid {...indexPreviewProps} />
            </EuiFormRow>
          </>
        </EuiFormRow>
      </EuiForm>

      <ConfigSectionTitle title="Transform configuration" />

      <EuiForm>
        {transformFunction === TRANSFORM_FUNCTION.PIVOT ? (
          <PivotFunctionForm
            {...{
              applyPivotChangesHandler,
              copyToClipboardPivot,
              copyToClipboardPivotDescription,
              stepDefineForm,
            }}
          />
        ) : null}
        {transformFunction === TRANSFORM_FUNCTION.LATEST ? (
          <LatestFunctionForm
            copyToClipboard={copyToClipboardPivot}
            copyToClipboardDescription={copyToClipboardPivotDescription}
            latestFunctionService={stepDefineForm.latestFunctionConfig}
          />
        ) : null}
      </EuiForm>
      <EuiSpacer size="m" />
      {(transformFunction !== TRANSFORM_FUNCTION.LATEST ||
        stepDefineForm.latestFunctionConfig.sortFieldOptions.length > 0) && (
        <EuiFormRow
          fullWidth
          label={i18n.translate('xpack.transform.stepDefineForm.previewLabel', {
            defaultMessage: 'Preview',
          })}
        >
          <>
            <DataGrid {...previewProps} />
            <EuiSpacer size="m" />
          </>
        </EuiFormRow>
      )}
    </div>
  );
};
