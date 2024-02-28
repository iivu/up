#!/usr/bin/env node

import path from 'node:path';
import fs from 'node:fs';
import process from 'node:process';
import prompts from 'prompts';
import { Command } from 'commander';

import pkg from '../package.json';
import configTemplate from './up.confog.template.json';
import { parseConfig, upload } from './core';
import * as t from './types';
import * as log from './log';

const upConfigFilePath = path.resolve(process.cwd(), './up.config.json');
const command = new Command();

command
  .name('up')
  .version(pkg.version, '-v, --version', 'output the current version')
  .option('-i, --init', 'initialize a new configuration file', false)
  .action(async (options) => {
    if (options.init) {
      initConfigFile();
    } else {
      await doUpload();
    }
  });

async function doUpload() {
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
}

function initConfigFile() {
  if (fs.existsSync(upConfigFilePath)) {
    log.error(`Configuration file already exists: ${upConfigFilePath}`);
    process.exit(1);
  }
  fs.writeFileSync(upConfigFilePath, JSON.stringify(configTemplate, null, 2), { encoding: 'utf-8' });
  log.success(`Configuration file created: ${upConfigFilePath}`);
  log.info('Please update the configuration file with the correct values and then run the up again.');
  process.exit(0);
}

command.parse(process.argv);
