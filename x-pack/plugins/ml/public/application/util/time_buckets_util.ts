/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { IUiSettingsClient } from '@kbn/core/public';
import { UI_SETTINGS } from '@kbn/data-plugin/public';
import moment from 'moment';
import { type TimeRangeBounds, type TimeBucketsInterval, TimeBuckets } from './time_buckets';

export function timeBucketsProvider(uiSettings: IUiSettingsClient) {
  return {
    getTimeBucketsFromCache(): InstanceType<typeof TimeBuckets> {
      return new TimeBuckets({
        [UI_SETTINGS.HISTOGRAM_MAX_BARS]: uiSettings.get(UI_SETTINGS.HISTOGRAM_MAX_BARS),
        [UI_SETTINGS.HISTOGRAM_BAR_TARGET]: uiSettings.get(UI_SETTINGS.HISTOGRAM_BAR_TARGET),
        dateFormat: uiSettings.get('dateFormat'),
        'dateFormat:scaled': uiSettings.get('dateFormat:scaled'),
      });
    },
    getBoundsRoundedToInterval(
      bounds: TimeRangeBounds,
      interval: TimeBucketsInterval,
      inclusiveEnd: boolean = false
    ): Required<TimeRangeBounds> {
      // Returns new bounds, created by flooring the min of the provided bounds to the start of
      // the specified interval (a moment duration), and rounded upwards (Math.ceil) to 1ms before
      // the start of the next interval (Kibana dashboards search >= bounds min, and <= bounds max,
      // so we subtract 1ms off the max to avoid querying start of the new Elasticsearch aggregation bucket).
      const intervalMs = interval.asMilliseconds();
      const adjustedMinMs = Math.floor(bounds.min!.valueOf() / intervalMs) * intervalMs;
      let adjustedMaxMs = Math.ceil(bounds.max!.valueOf() / intervalMs) * intervalMs;

      // Don't include the start ms of the next bucket unless specified..
      if (inclusiveEnd === false) {
        adjustedMaxMs = adjustedMaxMs - 1;
      }
      return { min: moment(adjustedMinMs), max: moment(adjustedMaxMs) };
    },
  };
}

export type TimeBucketsService = ReturnType<typeof timeBucketsProvider>;
