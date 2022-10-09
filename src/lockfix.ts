import * as execa from 'execa';
import * as shell from 'shelljs';
import { writeFileSync } from 'fs';
import { EOL } from 'os';
import { underline } from 'chalk';
import { generate } from 'shortid';
import { log } from './logger';
import { relative } from 'path';

interface LockfixProps {
  doCommit: boolean;
  force: boolean;
  quiet: boolean;
}

export default async function lockfix({
  doCommit,
  force,
  quiet,
}: LockfixProps): Promise<void> {
  log('🎬 Starting...', { quiet });

  if (!force && !(await isGitRoot())) {
    log('🤔 Not a Git root directory, exiting...', { quiet });

    return;
  }

  if (!(await isAnyUncommitedChnage())) {
    log('🤔 Nothing to do for me, exiting...', { quiet });

    return;
  }

  log('🔁 Applying changes', { quiet });

  if (doCommit) {
    await execa('git', ['add', '.']);
    await execa('git', ['commit', '--no-verify', '-m', '--lockfix--']);

    await printRevertInstructions(quiet);
  }

  const commitDiff: string = (
    await execa('git', [
      'diff',
      '--binary',
      ...(doCommit ? ['HEAD^'] : []),
      'HEAD',
    ])
  ).stdout;

  const matchPattern: RegExp = new RegExp(
    '^-(.*"integrity": "sha512-.*)\n+.*"integrity": "sha1-.*',
    'gm'
  );
  const replacePattern = '-$1\n+$1';
  const commitDiff1: string = commitDiff.replace(matchPattern, replacePattern);

  const patchName = `lockFixPatch-${generate()}.diff`;
  writeFileSync(patchName, commitDiff1 + EOL);
  await execa('git', ['reset', '--hard', ...(doCommit ? ['HEAD^'] : ['HEAD'])]);

  await execa('git', [
    'apply',
    '--ignore-space-change',
    '--ignore-whitespace',
    patchName,
  ]);
  shell.rm([patchName]);

  log('✅ Done', { quiet });
}

async function isGitRoot(): Promise<boolean> {
  const gitTopLevelDir: string = (
    await execa('git', ['rev-parse', '--show-toplevel'])
  ).stdout;
  const workingDirectory = process.cwd();

  return relative(gitTopLevelDir, workingDirectory) === '';
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

async function printRevertInstructions(quiet: boolean): Promise<void> {
  const commitHash: string = (await execa('git', ['rev-parse', 'HEAD'])).stdout;

  log(`🔙 ${prepareRevertInstruction(commitHash)}`, { quiet });
}

function prepareRevertInstruction(commitHash: string): string {
  return `In case of need – use command below to revert changes done by LockFix
${underline.bold(`git reset --hard ${commitHash} && git reset HEAD~1`)}`;
}
