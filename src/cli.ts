#!/usr/bin/env node

import lockfix from './lockfix';
import { program } from 'commander';

const pjson = require('../package.json');

program
  .name(pjson.name)
  .version(pjson.version)
  .action(lockfix)
  .parse(process.argv);
