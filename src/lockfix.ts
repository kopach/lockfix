import * as execa from 'execa';
import { writeFileSync } from 'fs';
import { EOL } from 'os';
import { red, black } from 'chalk';
import { generate } from 'shortid';

export default async function lockfix(): Promise<void> {
  if (!(await isAnythingToCommit())) {
    console.log('LockFix: nothing to do, exiting...');

    return;
  }

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
}

async function isAnythingToCommit(): Promise<boolean> {
  const result: string = (await execa('git', ['status', '--porcelain'])).stdout;

  if (!result) {
    return Promise.resolve(false);
  }

  return Promise.resolve(true);
}

async function printRevertInstructions(): Promise<void> {
  const commitHash: string = (await execa('git', ['rev-parse', 'HEAD'])).stdout;

  console.log(prepareRevertInstruction(commitHash));
}

function prepareRevertInstruction(commitHash: string): string {
  return `
${red('LockFix revert instruction')}
Use command below to revert changes done by LockFix
${black.bgBlackBright(`git reset --hard ${commitHash} && git reset HEAD~1`)}
  `;
}
