/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { JOB_STATE, DATAFEED_STATE } from '@kbn/ml-common-constants/states';
import { StatsBar } from '../../../../components/stats_bar';

import PropTypes from 'prop-types';
import React from 'react';
import { i18n } from '@kbn/i18n';

function createJobStats(jobsSummaryList, showNodeInfo) {
  const jobStats = {
    ...(showNodeInfo
      ? {
          activeNodes: {
            label: i18n.translate('xpack.ml.jobsList.statsBar.activeMLNodesLabel', {
              defaultMessage: 'Active ML nodes',
            }),
            value: 0,
            show: true,
          },
        }
      : {}),
    total: {
      label: i18n.translate('xpack.ml.jobsList.statsBar.totalJobsLabel', {
        defaultMessage: 'Total jobs',
      }),
      value: 0,
      show: true,
    },
    open: {
      label: i18n.translate('xpack.ml.jobsList.statsBar.openJobsLabel', {
        defaultMessage: 'Open jobs',
      }),
      value: 0,
      show: true,
    },
    closed: {
      label: i18n.translate('xpack.ml.jobsList.statsBar.closedJobsLabel', {
        defaultMessage: 'Closed jobs',
      }),
      value: 0,
      show: true,
    },
    failed: {
      label: i18n.translate('xpack.ml.jobsList.statsBar.failedJobsLabel', {
        defaultMessage: 'Failed jobs',
      }),
      value: 0,
      show: false,
    },
    activeDatafeeds: {
      label: i18n.translate('xpack.ml.jobsList.statsBar.activeDatafeedsLabel', {
        defaultMessage: 'Active datafeeds',
      }),
      value: 0,
      show: true,
    },
  };

  if (jobsSummaryList === undefined) {
    return jobStats;
  }

  // object to keep track of nodes being used by jobs
  const mlNodes = {};
  let failedJobs = 0;

  jobsSummaryList.forEach((job) => {
    if (job.jobState === JOB_STATE.OPENED) {
      jobStats.open.value++;
    } else if (job.jobState === JOB_STATE.CLOSED) {
      jobStats.closed.value++;
    } else if (job.jobState === JOB_STATE.FAILED) {
      failedJobs++;
    }

    if (job.hasDatafeed && job.datafeedState === DATAFEED_STATE.STARTED) {
      jobStats.activeDatafeeds.value++;
    }

    if (job.nodeName !== undefined) {
      mlNodes[job.nodeName] = {};
    }
  });

  jobStats.total.value = jobsSummaryList.length;

  // // Only show failed jobs if it is non-zero
  if (failedJobs) {
    jobStats.failed.value = failedJobs;
    jobStats.failed.show = true;
  } else {
    jobStats.failed.show = false;
  }

  if (showNodeInfo) {
    jobStats.activeNodes.value = Object.keys(mlNodes).length;
  }

  return jobStats;
}

export const JobStatsBar = ({ jobsSummaryList, showNodeInfo }) => {
  const jobStats = createJobStats(jobsSummaryList, showNodeInfo);

  return <StatsBar stats={jobStats} dataTestSub={'mlJobStatsBar'} />;
};

JobStatsBar.propTypes = {
  jobsSummaryList: PropTypes.array.isRequired,
  showNodeInfo: PropTypes.bool.isRequired,
};
