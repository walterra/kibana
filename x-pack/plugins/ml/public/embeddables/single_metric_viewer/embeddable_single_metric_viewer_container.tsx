/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EuiLoadingChart, EuiResizeObserver, EuiText } from '@elastic/eui';
import { Observable } from 'rxjs';
import { throttle } from 'lodash';
import { MlJob } from '@elastic/elasticsearch/lib/api/types';
import usePrevious from 'react-use/lib/usePrevious';
import { useToastNotificationService } from '../../application/services/toast_notification_service';
import { useEmbeddableExecutionContext } from '../common/use_embeddable_execution_context';
import { useSingleMetricViwerInputResolver } from './use_single_metric_viewer_input_resolver';
import type { ISingleMetricViewerEmbeddable } from './single_metric_viewer_embeddable';
import type {
  SingleMetricViewerEmbeddableInput,
  AnomalyChartsEmbeddableOutput,
  SingleMetricViewerEmbeddableServices,
} from '..';
import { ANOMALY_SINGLE_METRIC_VIEWER_EMBEDDABLE_TYPE } from '..';
import { TimeSeriesExplorerEmbeddableChart } from '../../application/timeseriesexplorer/timeseriesexplorer_embeddable_chart';
import { APP_STATE_ACTION } from '../../application/timeseriesexplorer/timeseriesexplorer_constants';
import './_index.scss';

const RESIZE_THROTTLE_TIME_MS = 500;

interface AppStateZoom {
  from?: string;
  to?: string;
}

export interface EmbeddableSingleMetricViewerContainerProps {
  id: string;
  embeddableContext: InstanceType<ISingleMetricViewerEmbeddable>;
  embeddableInput: Observable<SingleMetricViewerEmbeddableInput>;
  services: SingleMetricViewerEmbeddableServices;
  refresh: Observable<any>;
  onInputChange: (input: Partial<SingleMetricViewerEmbeddableInput>) => void;
  onOutputChange: (output: Partial<AnomalyChartsEmbeddableOutput>) => void;
  onRenderComplete: () => void;
  onLoading: () => void;
  onError: (error: Error) => void;
}

export const EmbeddableSingleMetricViewerContainer: FC<
  EmbeddableSingleMetricViewerContainerProps
> = ({
  id,
  embeddableContext,
  embeddableInput,
  services,
  refresh,
  onInputChange,
  onOutputChange,
  onRenderComplete,
  onError,
  onLoading,
}) => {
  useEmbeddableExecutionContext<SingleMetricViewerEmbeddableInput>(
    services[0].executionContext,
    embeddableInput,
    ANOMALY_SINGLE_METRIC_VIEWER_EMBEDDABLE_TYPE,
    id
  );
  const [chartWidth, setChartWidth] = useState<number>(0);
  const [zoom, setZoom] = useState<AppStateZoom | undefined>();
  const [selectedForecastId, setSelectedForecastId] = useState<string | undefined>();
  const [functionDescription, setFunctionDescription] = useState<string | undefined>();
  const [detectorIndex, setDetectorIndex] = useState<number>(0);
  const [selectedJob, setSelectedJob] = useState<MlJob | undefined>();
  const [autoZoomDuration, setAutoZoomDuration] = useState<number | undefined>();

  const isExplorerLoading = false;
  const { mlApiServices, mlTimeSeriesExplorer } = services[2];
  const { data, bounds, lastRefresh } = useSingleMetricViwerInputResolver(
    embeddableInput,
    refresh,
    services[1].data.query.timefilter.timefilter
  );
  const selectedJobId = data?.jobIds[0];
  const previousRefresh = usePrevious(lastRefresh ?? 0);

  // Holds the container height for previously fetched data
  const containerHeightRef = useRef<number>();
  const toastNotificationService = useToastNotificationService();

  useEffect(
    function setUpSelectedJob() {
      async function fetchSelectedJob() {
        if (mlApiServices && selectedJobId !== undefined) {
          const { jobs } = await mlApiServices.getJobs({ jobId: selectedJobId });
          const job = jobs[0];
          setSelectedJob(job);
        }
      }
      fetchSelectedJob();
    },
    [selectedJobId, mlApiServices]
  );

  useEffect(
    function setUpAutoZoom() {
      let zoomDuration: number | undefined;
      if (selectedJobId !== undefined && selectedJob !== undefined) {
        zoomDuration = mlTimeSeriesExplorer.getAutoZoomDuration(selectedJob);
        setAutoZoomDuration(zoomDuration);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedJobId, selectedJob?.job_id, mlTimeSeriesExplorer]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const resizeHandler = useCallback(
    throttle((e: { width: number; height: number }) => {
      // Keep previous container height so it doesn't change the page layout
      if (!isExplorerLoading) {
        containerHeightRef.current = e.height;
      }

      if (Math.abs(chartWidth - e.width) > 20) {
        setChartWidth(e.width);
      }
    }, RESIZE_THROTTLE_TIME_MS),
    [!isExplorerLoading, chartWidth]
  );

  const containerHeight = useMemo(() => {
    // Persists container height during loading to prevent page from jumping
    return isExplorerLoading ? containerHeightRef.current : undefined;
  }, [isExplorerLoading]);

  const appStateHandler = useCallback(
    (action: string, payload?: any) => {
      /**
       * Empty zoom indicates that chart hasn't been rendered yet,
       * hence any updates prior that should replace the URL state.
       */

      switch (action) {
        case APP_STATE_ACTION.SET_DETECTOR_INDEX:
          setDetectorIndex(payload);
          setFunctionDescription(undefined);
          break;

        case APP_STATE_ACTION.SET_FORECAST_ID:
          setSelectedForecastId(payload);
          setZoom(undefined);
          break;

        case APP_STATE_ACTION.SET_ZOOM:
          setZoom(payload);
          break;

        case APP_STATE_ACTION.UNSET_ZOOM:
          setZoom(undefined);
          break;

        case APP_STATE_ACTION.SET_FUNCTION_DESCRIPTION:
          setFunctionDescription(payload);
          break;
      }
    },

    [setZoom, setDetectorIndex, setFunctionDescription, setSelectedForecastId]
  );

  return (
    <EuiResizeObserver onResize={resizeHandler}>
      {(resizeRef) => (
        <div
          id={`mlSingleMetricViewerEmbeddableWrapper-${id}`}
          style={{
            width: '100%',
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '8px',
            height: containerHeight,
          }}
          data-test-subj={`mlSingleMetricViewer_${embeddableContext.id}`}
          ref={resizeRef}
          className="ml-time-series-explorer"
        >
          {isExplorerLoading && (
            <EuiText
              textAlign={'center'}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%,-50%)',
              }}
            >
              <EuiLoadingChart
                size="xl"
                mono={true}
                data-test-subj="mlAnomalySingleMetricViewerLoadingIndicator"
              />
            </EuiText>
          )}
          {data !== undefined && autoZoomDuration !== undefined && (
            <TimeSeriesExplorerEmbeddableChart
              chartWidth={chartWidth}
              dataViewsService={services[1].data.dataViews}
              mlApiServices={mlApiServices}
              toastNotificationService={toastNotificationService}
              appStateHandler={appStateHandler}
              autoZoomDuration={autoZoomDuration}
              bounds={bounds}
              lastRefresh={lastRefresh ?? 0}
              previousRefresh={previousRefresh}
              selectedJobId={selectedJobId}
              selectedDetectorIndex={detectorIndex}
              selectedEntities={data.selectedEntities}
              selectedForecastId={selectedForecastId}
              zoom={zoom}
              functionDescription={functionDescription}
              selectedJob={selectedJob}
            />
          )}
        </div>
      )}
    </EuiResizeObserver>
  );
};

// required for dynamic import using React.lazy()
// eslint-disable-next-line import/no-default-export
export default EmbeddableSingleMetricViewerContainer;
