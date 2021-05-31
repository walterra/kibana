/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { mean } from 'd3-array';

const euclidianVectorDistance = (x: number[], y: number[]): number =>
  Math.sqrt(x.reduce((acc, val, i) => acc + Math.pow(val - y[i], 2), 0));

const vectorsCenter = (cd: number[][]): number[] => {
  const center: number[] = [];
  const dimensions = cd[0].length;
  // get the xth value of each cluster member vector and calculate it's mean
  for (let i = 0; i < dimensions; i++) {
    center.push(mean(cd.map((d) => d[i])) ?? 0);
  }
  return center;
};

// s = (b - a) / max(b, a)
// - a is the mean distance between a data point and its cluster members
// - b is the mean distance between a data point and the cluster members of the nearest cluster closest to the data point’s cluster
export const silhouetteCoefficient = (
  data: number[][],
  clusterNums: number[]
): number => {
  const clusters = data.reduce((p, c, i) => {
    const clusterNum = clusterNums[i];

    if (p[clusterNum] === undefined) {
      p[clusterNum] = [c];
    } else {
      p[clusterNum].push(c);
    }

    return p;
  }, {} as Record<number, number[][]>);

  const scores: number[] = [];

  Object.values(clusters).map((clusterData) => {
    for (const c1 of clusterData) {
      const meanDistanceSameCluster = mean(
        clusterData.map((c2) => euclidianVectorDistance(c1, c2))
      );
      // console.log('meanDistanceSameCluster', meanDistanceSameCluster);

      const clusterCenter = vectorsCenter(clusterData);
      const closestCluster = Object.values(clusters).reduce((p, c) => {
        if (p === undefined) {
          return c;
        }

        const previousClusterCenter = vectorsCenter(p);
        const previousClusterDistance = euclidianVectorDistance(
          clusterCenter,
          previousClusterCenter
        );

        const compareClusterCenter = vectorsCenter(c);
        const compareClusterDistance = euclidianVectorDistance(
          clusterCenter,
          compareClusterCenter
        );

        // skip if we just compared against the current cluster
        if (compareClusterDistance === 0) {
          return p;
        }

        return compareClusterDistance < previousClusterDistance ? c : p;
      }, undefined as undefined | number[][]) as number[][];

      const meanDistanceClosestCluster = mean(
        closestCluster.map((c2) => euclidianVectorDistance(c1, c2))
      );

      const a = meanDistanceSameCluster ?? 0;
      const b = meanDistanceClosestCluster ?? 0;
      // console.log('a b', a, b);

      if (a > 0 && b > 0) {
        const score = (b - a) / Math.max(b, a);
        scores.push(score);
      }
    }
  });

  return mean(scores) ?? 0;
};
