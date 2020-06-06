import * as execa from 'execa';
import { writeFileSync } from 'fs';
import { EOL } from 'os';
import { underline } from 'chalk';
import { generate } from 'shortid';
import { log } from './logger';

export default async function lockfix(): Promise<void> {
  log('🎬 Starting...');

  if (!(await isAnyUncommitedChnage())) {
    log('🤔 Nothing to do for me, exiting...');

    return;
  }

  log('🔁 Applying changes');

  await execa('git', ['add', '.']);
  await execa('git', ['commit', '-m', '--lockfix--']);

  await printRevertInstructions();

  const commitDiff: string = (
    await execa('git', ['diff', '--binary', 'HEAD^', 'HEAD'])
  ).stdout;

  const matchPattern: RegExp = new RegExp(
    '^-(.*"integrity": "sha512-.*)\n+.*"integrity": "sha1-.*',
    'gm'
  );
  const replacePattern = '-$1\n+$1';
  const commitDiff1: string = commitDiff.replace(matchPattern, replacePattern);

  const patchName = `lockFixPatch-${generate()}.diff`;
  writeFileSync(patchName, commitDiff1 + EOL);
  await execa('git', ['reset', '--hard', 'HEAD^']);

  await execa('git', ['apply', patchName]);
  await execa('rm', [patchName]);

  log('✅ Done');
}

async function isAnyUncommitedChnage(): Promise<boolean> {
  const result: string = (await execa('git', ['status', '--porcelain'])).stdout;

  if (!result || !isChnagendLockFile(result)) {
    return Promise.resolve(false);
  }

  return Promise.resolve(true);
}

function isChnagendLockFile(str: string): boolean {
  return (
    str.indexOf('package-lock.json') !== -1 ||
    str.indexOf('npm-shrinkwrap.json') !== -1
  );
}

async function printRevertInstructions(): Promise<void> {
  const commitHash: string = (await execa('git', ['rev-parse', 'HEAD'])).stdout;

  log(`🔙 ${prepareRevertInstruction(commitHash)}`);
}

function prepareRevertInstruction(commitHash: string): string {
  return `In case of neeed – use command below to revert changes done by LockFix
${underline.bold(`git reset --hard ${commitHash} && git reset HEAD~1`)}`;
}
