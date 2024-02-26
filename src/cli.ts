import path from 'node:path';
import url from 'node:url';
import process from 'node:process';
import { Command } from 'commander';

import pkg from '../package.json';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const command = new Command();

command.name('up');
command.version(pkg.version, '-v, --version', 'output the current version');

command.parse(process.argv);
