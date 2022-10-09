#!/usr/bin/env node

import lockfix from './lockfix';
import { program } from 'commander';

const pjson = require('../package.json');

program
  .name(pjson.name)
  .version(pjson.version)
  .option(
    '-c, --commit',
    'make backup commit with revert instruction before applying changes'
  )
  .option('-f, --force', 'bypass Git root directory check')
  .option('-q, --quiet', 'suppress output')
  .parse(process.argv);

lockfix({
  doCommit: program.commit !== undefined,
  force: program.force !== undefined,
  quiet: program.quiet !== undefined,
});
