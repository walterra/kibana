/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { IScopedClusterClient, CoreStart, SavedObjectsClientContract } from '@kbn/core/server';
import type { SecurityPluginSetup } from '@kbn/security-plugin/server';
import { ML_JOB_SAVED_OBJECT_TYPE } from '@kbn/ml-common-types/saved_objects';
import { savedObjectClientsFactory } from '../util';
import { syncSavedObjectsFactory } from '../sync';
import type { JobObject } from '../service';
import { mlSavedObjectServiceFactory } from '../service';
import { mlLog } from '../../lib/log';
import { createJobSpaceOverrides } from './space_overrides';

/**
 * Creates initializeJobs function which is used to check whether
 * ml job saved objects exist and creates them if needed
 *
 * @param core: CoreStart
 */
export function jobSavedObjectsInitializationFactory(
  core: CoreStart,
  security: SecurityPluginSetup | undefined,
  spacesEnabled: boolean
) {
  const client = core.elasticsearch.client as unknown as IScopedClusterClient;

  /**
   * Check whether ML saved objects exist.
   * If they don't, check to see whether ML jobs exist.
   * If jobs exist, but the saved objects do not, create the saved objects.
   *
   */
  async function initializeJobs() {
    try {
      const { getInternalSavedObjectsClient } = savedObjectClientsFactory(() => core.savedObjects);
      const savedObjectsClient = getInternalSavedObjectsClient();
      if (savedObjectsClient === null) {
        mlLog.error('Internal saved object client not initialized!');
        return;
      }

      if ((await _needsInitializing(savedObjectsClient)) === false) {
        // ml job saved objects have already been initialized
        return;
      }

      const mlSavedObjectService = mlSavedObjectServiceFactory(
        savedObjectsClient,
        savedObjectsClient,
        spacesEnabled,
        security?.authz,
        client,
        () => Promise.resolve() // pretend isMlReady, to allow us to initialize the saved objects
      );

      mlLog.info('Initializing ML saved objects');
      // create space overrides for specific jobs
      const jobSpaceOverrides = await createJobSpaceOverrides(client);
      // initialize jobs
      const { initSavedObjects } = syncSavedObjectsFactory(client, mlSavedObjectService);
      const { jobs, trainedModels } = await initSavedObjects(false, jobSpaceOverrides);
      mlLog.info(`${jobs.length + trainedModels.length} ML saved objects initialized`);
    } catch (error) {
      mlLog.error(`Error Initializing ML saved objects ${JSON.stringify(error)}`);
    }
  }

  async function _needsInitializing(savedObjectsClient: SavedObjectsClientContract) {
    if (false && (await _jobSavedObjectsExist(savedObjectsClient))) {
      // at least one ml saved object exists
      // this has been initialized before
      // this check is currently disabled to allow the initialization to run
      // on every kibana restart
      return false;
    }

    if (await _jobsExist()) {
      // some ml jobs exist, we need to create those saved objects
      return true;
    }

    // no ml jobs actually exist,
    // that's why there were no saved objects
    return false;
  }

  async function _jobSavedObjectsExist(savedObjectsClient: SavedObjectsClientContract) {
    const options = {
      type: ML_JOB_SAVED_OBJECT_TYPE,
      perPage: 0,
      namespaces: ['*'],
    };

    const { total } = await savedObjectsClient.find<JobObject>(options);
    return total > 0;
  }

  async function _jobsExist() {
    // it would be better to use a simple count search here
    // but the kibana user does not have access to .ml-config
    //
    // const { body } = await client.asInternalUser.count({
    //   index: '.ml-config',
    // });
    // return body.count > 0;
    let adJobsCount = 0;
    let dfaJobsCount = 0;

    try {
      const adJobs = await client.asInternalUser.ml.getJobs();
      adJobsCount = adJobs.count;
    } catch (error) {
      mlLog.debug(`Error fetching ML anomaly detection jobs ${JSON.stringify(error)}`);
    }
    try {
      const dfaJobs = await client.asInternalUser.ml.getDataFrameAnalytics();
      dfaJobsCount = dfaJobs.count;
    } catch (error) {
      mlLog.debug(`Error fetching ML data frame analytics jobs ${JSON.stringify(error)}`);
    }
    return adJobsCount > 0 || dfaJobsCount > 0;
  }

  return { initializeJobs };
}
