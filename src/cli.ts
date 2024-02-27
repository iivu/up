#!/usr/bin/env node

import path from 'node:path';
import process from 'node:process';
import prompts from 'prompts';
import { Command } from 'commander';

import pkg from '../package.json';
import { parseConfig, upload } from './core';
import * as t from './types';
import * as log from './log';

const upConfigFilePath = path.resolve(process.cwd(), './up.config.json');
const command = new Command();

command.name('up');
command.version(pkg.version, '-v, --version', 'output the current version');
command.action(async () => {
  const config: t.Config = parseConfig(upConfigFilePath);
  log.info(config);
  log.info('Above is the final configuration to be used for the upload process.');
  const confirm = await prompts({
    type: 'confirm',
    name: 'value',
    message: 'Confirm the configuration and continue?',
    initial: true,
  });
  if (!confirm.value) process.exit(0);
  await upload(config);
});

command.parse(process.argv);
