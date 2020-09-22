#!/usr/bin/env node

import lockfix from './lockfix';
import { program } from 'commander';

const pjson = require('../package.json');

program
  .name(pjson.name)
  .version(pjson.version)
  .option(
    '-c, --commit',
    'make commit as a backup of current working directory state'
  )
  .parse(process.argv);

lockfix(program.commit !== undefined);
