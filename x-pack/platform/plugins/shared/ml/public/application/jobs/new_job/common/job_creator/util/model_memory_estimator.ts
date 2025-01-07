/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { Observable } from 'rxjs';
import { combineLatest, of, Subject, Subscription } from 'rxjs';
import { isEqual, cloneDeep } from 'lodash';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  pluck,
  startWith,
  switchMap,
  map,
  pairwise,
  filter,
  skipWhile,
} from 'rxjs';
import { useEffect, useMemo } from 'react';

import { i18n } from '@kbn/i18n';
import { type MLHttpFetchError, extractErrorMessage } from '@kbn/ml-error-utils';
import { DEFAULT_MODEL_MEMORY_LIMIT } from '@kbn/ml-common-constants/new_job';
import { useMlKibana } from '@kbn/ml-kibana-context';
import type { MlApi } from '@kbn/ml-services/ml_api_service';

import type { JobValidator } from '../../job_validator/job_validator';
import { VALIDATION_DELAY_MS } from '../../job_validator/job_validator';
import type { JobCreator } from '../job_creator';

export type CalculatePayload = Parameters<MlApi['calculateModelMemoryLimit$']>[0];

type ModelMemoryEstimator = ReturnType<typeof modelMemoryEstimatorProvider>;

export const modelMemoryEstimatorProvider = (
  jobCreator: JobCreator,
  jobValidator: JobValidator,
  mlApi: MlApi
) => {
  const modelMemoryCheck$ = new Subject<CalculatePayload>();
  const error$ = new Subject<MLHttpFetchError>();

  return {
    get error$(): Observable<MLHttpFetchError> {
      return error$.asObservable();
    },
    get updates$(): Observable<string> {
      return combineLatest([
        jobCreator.wizardInitialized$.pipe(
          skipWhile((wizardInitialized) => wizardInitialized === false)
        ),
        modelMemoryCheck$,
      ]).pipe(
        map(([, payload]) => payload),
        // delay the request, making sure the validation is completed
        debounceTime(VALIDATION_DELAY_MS + 100),
        // clone the object to compare payloads and proceed further only
        // if the configuration has been changed
        map(cloneDeep),
        distinctUntilChanged(isEqual),
        // don't call the endpoint with invalid payload
        filter(() => jobValidator.isModelMemoryEstimationPayloadValid),
        switchMap((payload) => {
          return mlApi.calculateModelMemoryLimit$(payload).pipe(
            pluck('modelMemoryLimit'),
            catchError((error) => {
              // eslint-disable-next-line no-console
              console.error('Model memory limit could not be calculated', error.body);
              error$.next(error);
              // fallback to the default in case estimation failed
              return of(DEFAULT_MODEL_MEMORY_LIMIT);
            })
          );
        })
      );
    },
    update(payload: CalculatePayload) {
      modelMemoryCheck$.next(payload);
    },
  };
};

export const useModelMemoryEstimator = (
  jobCreator: JobCreator,
  jobValidator: JobValidator,
  jobCreatorUpdate: Function,
  jobCreatorUpdated: number
) => {
  const {
    services: {
      notifications,
      mlServices: { mlApi },
    },
  } = useMlKibana();

  // Initialize model memory estimator only once
  const modelMemoryEstimator = useMemo<ModelMemoryEstimator>(
    () => modelMemoryEstimatorProvider(jobCreator, jobValidator, mlApi),
    [jobCreator, jobValidator, mlApi]
  );

  // Listen for estimation results and errors
  useEffect(() => {
    const subscription = new Subscription();

    subscription.add(
      modelMemoryEstimator.updates$
        .pipe(startWith(jobCreator.modelMemoryLimit), pairwise())
        .subscribe(([previousEstimation, currentEstimation]) => {
          // to make sure we don't overwrite a manual input
          if (
            jobCreator.modelMemoryLimit === null ||
            jobCreator.modelMemoryLimit === previousEstimation
          ) {
            jobCreator.modelMemoryLimit = currentEstimation;
            // required in order to trigger changes on the input
            jobCreatorUpdate();
          }
        })
    );

    subscription.add(
      modelMemoryEstimator.error$.subscribe((error) => {
        notifications.toasts.addWarning({
          title: i18n.translate('xpack.ml.newJob.wizard.estimateModelMemoryError', {
            defaultMessage: 'Model memory limit could not be calculated',
          }),
          text: i18n.translate('xpack.ml.newJob.wizard.estimateModelMemoryErrorText', {
            defaultMessage:
              '{errorText}. You can proceed with creating the job, but check for warning messages once the job is running that the configured limit has not been exceeded.',
            values: { errorText: extractErrorMessage(error) },
          }),
        });
      })
    );

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelMemoryEstimator]);

  // Update model memory estimation payload on the job creator updates
  useEffect(() => {
    modelMemoryEstimator.update({
      datafeedConfig: jobCreator.datafeedConfig,
      analysisConfig: jobCreator.jobConfig.analysis_config,
      indexPattern: jobCreator.indexPatternTitle,
      query: jobCreator.datafeedConfig.query,
      timeFieldName: jobCreator.jobConfig.data_description.time_field!,
      earliestMs: jobCreator.start,
      latestMs: jobCreator.end,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobCreator, jobCreatorUpdated]);
};
