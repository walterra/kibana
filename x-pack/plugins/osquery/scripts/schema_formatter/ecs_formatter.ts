/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { map, partialRight, pick } from 'lodash';
import { promises as fs } from 'fs';
import path from 'path';

import { run } from '@kbn/dev-utils';

const ECS_COLUMN_SCHEMA_FIELDS = ['field', 'type', 'description'];

run(
  async ({ flags }) => {
    const schemaPath = path.resolve(`../public/common/schemas/ecs/`);
    const schemaFile = path.join(schemaPath, flags.schema_version as string);
    const schemaData = await require(schemaFile);

    const formattedSchema = map(schemaData, partialRight(pick, ECS_COLUMN_SCHEMA_FIELDS));

    await fs.writeFile(
      path.join(schemaPath, `v${flags.schema_version}-formatted.json`),
      JSON.stringify(formattedSchema)
    );
  },
  {
    description: `
      Script for formatting generated osquery API schema JSON file.
    `,
    flags: {
      string: ['schema_version'],
      help: `
        --schema_version The semver string for the schema file located in public/common/schemas/ecs/
      `,
    },
  }
);
