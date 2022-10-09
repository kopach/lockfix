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
  .option('-f, --force', 'bypass Git root directory check')
  .parse(process.argv);

lockfix({
  doCommit: program.commit !== undefined,
  force: program.force !== undefined,
});
