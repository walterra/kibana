/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import {
  AnnotationDomainType,
  AreaSeries,
  Axis,
  AxisStyle,
  BrushEndListener,
  Chart,
  CurveType,
  LineAnnotation,
  LineAnnotationDatum,
  PartialTheme,
  Position,
  RectAnnotation,
  RecursivePartial,
  ScaleType,
  Settings,
} from '@elastic/charts';

import euiVars from '@elastic/eui/dist/eui_theme_light.json';

import { euiPaletteColorBlind } from '@elastic/eui';

import { i18n } from '@kbn/i18n';

import { getDurationFormatter } from '../../../../common/utils/formatters';

import { HistogramItem } from '../../../../common/search_strategies/correlations/types';

import { FETCH_STATUS } from '../../../hooks/use_fetcher';
import { useTheme } from '../../../hooks/use_theme';

import { ChartContainer } from '../../shared/charts/chart_container';

const { euiColorMediumShade } = euiVars;
const axisColor = euiColorMediumShade;

const axes: RecursivePartial<AxisStyle> = {
  axisLine: {
    stroke: axisColor,
  },
  tickLabel: {
    fontSize: 10,
    fill: axisColor,
    padding: 0,
  },
  tickLine: {
    stroke: axisColor,
    size: 5,
  },
  gridLine: {
    horizontal: {
      dash: [1, 2],
    },
    vertical: {
      strokeWidth: 1,
    },
  },
};
const chartTheme: PartialTheme = {
  axes,
  legend: {
    spacingBuffer: 100,
  },
  areaSeriesStyle: {
    line: {
      visible: false,
    },
  },
};

// Log based axis cannot start a 0. Use a small positive number instead.
const yAxisDomain = {
  min: 0.9,
};

interface CorrelationsChartProps {
  field?: string;
  value?: string;
  histogram?: HistogramItem[];
  markerCurrentTransaction?: number;
  markerValue: number;
  markerPercentile: number;
  overallHistogram?: HistogramItem[];
  onChartSelection?: BrushEndListener;
  selection?: [number, number];
}

const getAnnotationsStyle = (color = 'gray') => ({
  line: {
    strokeWidth: 1,
    stroke: color,
    opacity: 0.8,
  },
  details: {
    fontSize: 8,
    fontFamily: 'Arial',
    fontStyle: 'normal',
    fill: color,
    padding: 0,
  },
});

const CHART_PLACEHOLDER_VALUE = 0.0001;

// Elastic charts will show any lone bin (i.e. a populated bin followed by empty bin)
// as a circular marker instead of a bar
// This provides a workaround by making the next bin not empty
export const replaceHistogramDotsWithBars = (
  originalHistogram: HistogramItem[] | undefined
) => {
  if (originalHistogram === undefined) return;
  const histogram = [...originalHistogram];
  {
    for (let i = 0; i < histogram.length - 1; i++) {
      if (
        histogram[i].doc_count > 0 &&
        histogram[i].doc_count !== CHART_PLACEHOLDER_VALUE &&
        histogram[i + 1].doc_count === 0
      ) {
        histogram[i + 1].doc_count = CHART_PLACEHOLDER_VALUE;
      }
    }
    return histogram;
  }
};

export function CorrelationsChart({
  field,
  value,
  histogram: originalHistogram,
  markerCurrentTransaction,
  markerValue,
  markerPercentile,
  overallHistogram,
  onChartSelection,
  selection,
}: CorrelationsChartProps) {
  const euiTheme = useTheme();

  const annotationsDataValues: LineAnnotationDatum[] = [
    {
      dataValue: markerValue,
      details: i18n.translate(
        'xpack.apm.correlations.latency.chart.percentileMarkerLabel',
        {
          defaultMessage: '{markerPercentile}th percentile',
          values: {
            markerPercentile,
          },
        }
      ),
    },
  ];

  const xMax = Math.max(...(overallHistogram ?? []).map((d) => d.key)) ?? 0;

  const durationFormatter = getDurationFormatter(xMax);

  const histogram = replaceHistogramDotsWithBars(originalHistogram);

  const selectionAnnotation =
    selection !== undefined
      ? [
          {
            coordinates: {
              x0: selection[0],
              x1: selection[1],
              y0: 0,
              y1: 100000,
            },
            details: 'selection',
          },
        ]
      : undefined;

  return (
    <div
      data-test-subj="apmCorrelationsChart"
      style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
    >
      <ChartContainer
        height={250}
        hasData={Array.isArray(overallHistogram) && overallHistogram.length > 0}
        status={
          Array.isArray(overallHistogram)
            ? FETCH_STATUS.SUCCESS
            : FETCH_STATUS.LOADING
        }
      >
        <Chart>
          <Settings
            rotation={0}
            theme={chartTheme}
            showLegend
            legendPosition={Position.Bottom}
            onBrushEnd={onChartSelection}
          />
          {selectionAnnotation !== undefined && (
            <RectAnnotation
              dataValues={selectionAnnotation}
              id="rect_annotation_1"
              style={{
                strokeWidth: 1,
                stroke: '#e5e5e5',
                fill: '#e5e5e5',
                opacity: 0.9,
              }}
              hideTooltips={true}
            />
          )}
          {typeof markerCurrentTransaction === 'number' && (
            <LineAnnotation
              id="annotation_current_transaction"
              domainType={AnnotationDomainType.XDomain}
              dataValues={[
                {
                  dataValue: markerCurrentTransaction,
                  details: i18n.translate(
                    'xpack.apm.correlations.latency.chart.currentTransactionMarkerLabel',
                    {
                      defaultMessage: 'Current sample',
                    }
                  ),
                },
              ]}
              style={getAnnotationsStyle(euiPaletteColorBlind()[0])}
              marker={i18n.translate(
                'xpack.apm.correlations.latency.chart.currentTransactionMarkerLabel',
                {
                  defaultMessage: 'Current sample',
                }
              )}
              markerPosition={'top'}
            />
          )}
          <LineAnnotation
            id="apmCorrelationsChartPercentileAnnotation"
            domainType={AnnotationDomainType.XDomain}
            dataValues={annotationsDataValues}
            style={getAnnotationsStyle()}
            marker={`${markerPercentile}p`}
            markerPosition={'top'}
          />
          <Axis
            id="x-axis"
            title=""
            position={Position.Bottom}
            tickFormat={(d) => durationFormatter(d).formatted}
          />
          <Axis
            id="y-axis"
            domain={yAxisDomain}
            title={i18n.translate(
              'xpack.apm.correlations.latency.chart.numberOfTransactionsLabel',
              { defaultMessage: '# transactions' }
            )}
            position={Position.Left}
            tickFormat={(d) =>
              d === 0 || Number.isInteger(Math.log10(d)) ? d : ''
            }
          />
          <AreaSeries
            id={i18n.translate(
              'xpack.apm.correlations.latency.chart.overallLatencyDistributionLabel',
              { defaultMessage: 'Overall latency distribution' }
            )}
            xScaleType={ScaleType.Log}
            yScaleType={ScaleType.Log}
            data={overallHistogram ?? []}
            curve={CurveType.CURVE_STEP_AFTER}
            xAccessor="key"
            yAccessors={['doc_count']}
            color={euiTheme.eui.euiColorVis1}
            fit="lookahead"
          />
          {Array.isArray(histogram) &&
            field !== undefined &&
            value !== undefined && (
              <AreaSeries
                id={i18n.translate(
                  'xpack.apm.correlations.latency.chart.selectedTermLatencyDistributionLabel',
                  {
                    defaultMessage: '{fieldName}:{fieldValue}',
                    values: {
                      fieldName: field,
                      fieldValue: value,
                    },
                  }
                )}
                xScaleType={ScaleType.Log}
                yScaleType={ScaleType.Log}
                data={histogram}
                curve={CurveType.CURVE_STEP_AFTER}
                xAccessor="key"
                yAccessors={['doc_count']}
                color={euiTheme.eui.euiColorVis2}
              />
            )}
        </Chart>
      </ChartContainer>
    </div>
  );
}
