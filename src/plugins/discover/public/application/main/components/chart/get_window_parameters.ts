/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

export interface WindowParameters {
  baselineMin: number;
  baselineMax: number;
  deviationMin: number;
  deviationMax: number;
}

/*
 * Given a point in time (e.g. where a user clicks), use simple heuristics to compute:
 *
 * 1. The time window around the click to evaluate for changes
 * 2. The historical time window prior to the click to use as a baseline.
 *
 * The philosophy here is that charts are displayed with different granularities according to their
 * overall time window. We select the change point and historical time windows inline with the
 * overall time window.
 *
 * The algorithm for doing this is based on the typical granularities that exist in machine data.
 *
 * :param clickTime
 * :param minTime
 * :param maxTime
 * :return: { baseline_min, baseline_max, deviation_min, deviation_max }
 */
export const getWindowParameters = (
  clickTime: number,
  minTime: number,
  maxTime: number
): WindowParameters => {
  const totalWindow = maxTime - minTime;

  // min deviation window
  const minDeviationWindow = 10 * 60 * 1000; // 10min
  const minBaselineWindow = 30 * 60 * 1000; // 30min
  const minWindowGap = 5 * 60 * 1000; // 5min

  // work out bounds
  const deviationWindow = Math.max(totalWindow / 10, minDeviationWindow);
  const baselineWindow = Math.max(totalWindow / 3.5, minBaselineWindow);
  const windowGap = Math.max(totalWindow / 10, minWindowGap);

  const deviationMin = clickTime - deviationWindow / 2;
  const deviationMax = clickTime + deviationWindow / 2;

  const baselineMax = deviationMin - windowGap;
  const baselineMin = baselineMax - baselineWindow;

  return {
    baselineMin: Math.round(baselineMin),
    baselineMax: Math.round(baselineMax),
    deviationMin: Math.round(deviationMin),
    deviationMax: Math.round(deviationMax),
  };
};
