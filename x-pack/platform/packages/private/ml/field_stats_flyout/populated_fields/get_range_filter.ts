/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { TimeRange as TimeRangeMs } from '@kbn/ml-date-picker';
import { isPopulatedObject } from '@kbn/ml-is-populated-object';

/**
 * Get range filter for datetime field. Both arguments are optional.
 * @param datetimeField
 * @param timeRange
 * @returns range filter
 */
export const getRangeFilter = (datetimeField?: string, timeRange?: TimeRangeMs) => {
  if (timeRange && datetimeField !== undefined) {
    if (isPopulatedObject(timeRange, ['from', 'to']) && timeRange.to > timeRange.from) {
      return {
        range: {
          [datetimeField]: {
            gte: timeRange.from,
            lte: timeRange.to,
            format: 'epoch_millis',
          },
        },
      };
    }
  }
};
