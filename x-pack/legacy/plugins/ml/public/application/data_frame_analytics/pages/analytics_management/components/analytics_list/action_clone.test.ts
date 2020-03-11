/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { isAdvancedConfig } from './action_clone';

describe('Analytics job clone action', () => {
  describe('isAdvancedConfig', () => {
    test('should detect a classification job created with the form', () => {
      const formCreatedClassificationJob = {
        id: 'bank_classification_1',
        description: "Classification job with 'bank-marketing' dataset",
        source: {
          index: ['bank-marketing'],
          query: {
            match_all: {},
          },
        },
        dest: {
          index: 'dest_bank_1',
          results_field: 'ml',
        },
        analysis: {
          classification: {
            dependent_variable: 'y',
            num_top_classes: 2,
            prediction_field_name: 'y_prediction',
            training_percent: 2,
            randomize_seed: 6233212276062807000,
          },
        },
        analyzed_fields: {
          includes: [],
          excludes: [],
        },
        model_memory_limit: '350mb',
        create_time: 1583417086689,
        version: '8.0.0',
        allow_lazy_start: false,
      };

      expect(isAdvancedConfig(formCreatedClassificationJob)).toBe(false);
    });

    test('should detect a outlier_detection job created with the form', () => {
      const formCreatedOutlierDetectionJob = {
        id: 'glass_outlier_detection_1',
        description: "Outlier detection job with 'glass' dataset",
        source: {
          index: ['glass_withoutdupl_norm'],
          query: {
            match_all: {},
          },
        },
        dest: {
          index: 'dest_glass_1',
          results_field: 'ml',
        },
        analysis: {
          outlier_detection: {
            compute_feature_influence: true,
            outlier_fraction: 0.05,
            standardization_enabled: true,
          },
        },
        analyzed_fields: {
          includes: [],
          excludes: ['id', 'outlier'],
        },
        model_memory_limit: '1mb',
        create_time: 1583417347446,
        version: '8.0.0',
        allow_lazy_start: false,
      };
      expect(isAdvancedConfig(formCreatedOutlierDetectionJob)).toBe(false);
    });

    test('should detect a regression job created with the form', () => {
      const formCreatedRegressionJob = {
        id: 'grid_regression_1',
        description: "Regression job with 'electrical-grid-stability' dataset",
        source: {
          index: ['electrical-grid-stability'],
          query: {
            match_all: {},
          },
        },
        dest: {
          index: 'dest_grid_1',
          results_field: 'ml',
        },
        analysis: {
          regression: {
            dependent_variable: 'stab',
            prediction_field_name: 'stab_prediction',
            training_percent: 20,
            randomize_seed: -2228827740028660200,
          },
        },
        analyzed_fields: {
          includes: [],
          excludes: [],
        },
        model_memory_limit: '150mb',
        create_time: 1583417178919,
        version: '8.0.0',
        allow_lazy_start: false,
      };

      expect(isAdvancedConfig(formCreatedRegressionJob)).toBe(false);
    });

    test('should detect advanced classification job', () => {
      const advancedClassificationJob = {
        id: 'bank_classification_1',
        description: "Classification job with 'bank-marketing' dataset",
        source: {
          index: ['bank-marketing'],
          query: {
            match_all: {},
          },
        },
        dest: {
          index: 'dest_bank_1',
          results_field: 'CUSTOM_RESULT_FIELD',
        },
        analysis: {
          classification: {
            dependent_variable: 'y',
            num_top_classes: 2,
            prediction_field_name: 'y_prediction',
            training_percent: 2,
            randomize_seed: 6233212276062807000,
          },
        },
        analyzed_fields: {
          includes: [],
          excludes: [],
        },
        model_memory_limit: '350mb',
        create_time: 1583417086689,
        version: '8.0.0',
        allow_lazy_start: false,
      };

      expect(isAdvancedConfig(advancedClassificationJob)).toBe(true);
    });

    test('should detect advanced outlier_detection job', () => {
      const advancedOutlierDetectionJob = {
        id: 'glass_outlier_detection_1',
        description: "Outlier detection job with 'glass' dataset",
        source: {
          index: ['glass_withoutdupl_norm'],
          query: {
            // TODO check default for `match`
            match_all: {},
          },
        },
        dest: {
          index: 'dest_glass_1',
          results_field: 'ml',
        },
        analysis: {
          outlier_detection: {
            compute_feature_influence: false,
            outlier_fraction: 0.05,
            standardization_enabled: true,
          },
        },
        analyzed_fields: {
          includes: [],
          excludes: ['id', 'outlier'],
        },
        model_memory_limit: '1mb',
        create_time: 1583417347446,
        version: '8.0.0',
        allow_lazy_start: false,
      };
      expect(isAdvancedConfig(advancedOutlierDetectionJob)).toBe(true);
    });

    test('should detect a custom query', () => {
      const advancedRegressionJob = {
        id: 'grid_regression_1',
        description: "Regression job with 'electrical-grid-stability' dataset",
        source: {
          index: ['electrical-grid-stability'],
          query: {
            match: {
              custom_field: 'custom_match',
            },
          },
        },
        dest: {
          index: 'dest_grid_1',
          results_field: 'ml',
        },
        analysis: {
          regression: {
            dependent_variable: 'stab',
            prediction_field_name: 'stab_prediction',
            training_percent: 20,
            randomize_seed: -2228827740028660200,
          },
        },
        analyzed_fields: {
          includes: [],
          excludes: [],
        },
        model_memory_limit: '150mb',
        create_time: 1583417178919,
        version: '8.0.0',
        allow_lazy_start: false,
      };

      expect(isAdvancedConfig(advancedRegressionJob)).toBe(true);
    });

    test('should detect custom analysis settings', () => {
      const config = {
        description: "Classification clone with 'bank-marketing' dataset",
        source: {
          index: 'bank-marketing',
        },
        dest: {
          index: 'bank_classification4',
        },
        analyzed_fields: {
          excludes: [],
        },
        analysis: {
          classification: {
            dependent_variable: 'y',
            training_percent: 71,
            maximum_number_trees: 1500,
          },
        },
        model_memory_limit: '400mb',
      };

      expect(isAdvancedConfig(config)).toBe(true);
    });
  });
});
