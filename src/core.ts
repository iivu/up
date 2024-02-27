import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import SFTPClient from 'ssh2-sftp-client';
import { glob } from 'glob';

import * as log from './log';
import * as t from './types';

const DEFAULT_CONFIG: Pick<t.Config, 'port' | 'exclude'> = {
  port: 22,
  exclude: [],
};

export function parseConfig(configFilePth: string): t.Config {
  log.info(`Reading configuration from file: ${configFilePth}`);
  if (!fs.existsSync(configFilePth)) {
    log.error(`Configuration file not found: ${configFilePth}`);
    process.exit(1);
  }
  const config: t.Config = JSON.parse(fs.readFileSync(configFilePth, 'utf-8'));
  log.info('Configuration file read successfully, validating the configuration...');
  validateConfig(config);
  normalizeConfig(config);
  return config;
}

export async function upload(config: t.Config) {
  const localPaths = await parseLocalPath(config);
  const localDirPathToRemoteMap: Record<string, string> = mapLocalPathToRemote(localPaths.dirs, config);
  const localFilePathToRemoteMap: Record<string, string> = mapLocalPathToRemote(localPaths.files, config);
  const client: SFTPClient = await connect(config);
  try {
    const exists = await client.exists(config.remotePath);
    if (!exists) {
      log.warn(`Remote path: ${config.remotePath} not exists, creating now...`);
      await client.mkdir(config.remotePath, true);
    }
    // first create all the directories
    for (const localDirPath of localPaths.dirs) {
      const remoteDirPath = localDirPathToRemoteMap[localDirPath];
      const exists = await client.exists(remoteDirPath);
      if (!exists) {
        log.warn(`Remote path: ${remoteDirPath} not exists, creating now...`);
        await client.mkdir(remoteDirPath, true);
      }
    }
    // then upload all the files
    for (const localFilePath of localPaths.files) {
      const remoteFilePath = localFilePathToRemoteMap[localFilePath];
      log.info(`Uploading: ${localFilePath} -> ${remoteFilePath}`);
      await client.put(localFilePath, remoteFilePath);
    }
    log.success(`Upload completed successfully!`);
    process.exit(0);
  } catch (e: any) {
    log.error(`Remote operation exception: ${e.message}`);
    process.exit(1);
  }
}

async function connect(config: t.ConnectConfig): Promise<SFTPClient> {
  const client = new SFTPClient('up');
  try {
    log.info('Connecting to the server...');
    await client.connect(config);
    return client;
  } catch (e: any) {
    log.error(`Failed to connect to the server: ${e.message}`);
    process.exit(1);
  }
}

/**
 * Parse local file path and return an array of absolute file paths
 * If localPath is a file, return an array with the absolute path of the file
 * If localPath is a directory, return an array with the absolute path of all files in the directory
 * To ignore some file, use the exclude field in the config, which is an array of glob patterns
 */
async function parseLocalPath(config: t.Config): Promise<{ dirs: string[]; files: string[] }> {
  // After the parseConfig function, we are sure that localPath is an absolute path
  const localPath = config.localPath;
  if (!fs.existsSync(localPath)) {
    log.error(`Local path not found: ${localPath}`);
    process.exit(1);
  }
  const fileStat = fs.statSync(localPath);
  if (fileStat.isFile()) {
    return { dirs: [], files: [localPath] };
  }
  if (fileStat.isDirectory()) {
    const allFiles = await glob(`${localPath}/**/*`, { ignore: config.exclude });
    const result: { dirs: string[]; files: string[] } = { dirs: [], files: [] };
    allFiles.forEach((file) => {
      if (fs.statSync(file).isDirectory()) {
        result.dirs.push(file);
      } else {
        result.files.push(file);
      }
    });
    // ensure that the parent directory comes first
    result.dirs.sort((a, b) => a.length - b.length);
    return result;
  }
  // fileStat is neither a file nor a directory
  log.error(`Unknown file stat: ${localPath}`);
  process.exit(1);
}

/**
 * Map local file paths to remote file paths
 * For example:
 * If localPath is /home/user/project and remotePath is /var/www/project,
 * and we have a file /home/user/project/index.html,
 * the remote file path will be /var/www/project/index.html
 */
function mapLocalPathToRemote(localPath: string[], config: t.Config): Record<string, string> {
  const result: Record<string, string> = {};
  localPath.forEach((file) => {
    if (file === config.localPath) {
      // the config.localPath is a file
      const segments = file.split(path.sep);
      result[file] = `${config.remotePath}/${segments[segments.length - 1]}`;
    } else {
      // the config.localPath is q directory
      result[file] = file.replace(config.localPath, config.remotePath);
    }
  });
  return result;
}

function validateConfig(config: t.Config) {
  const requiredFields = ['host', 'username', 'password', 'localPath', 'remotePath'];
  const missingFields = requiredFields.filter((field) => !config[field as keyof t.Config]);
  if (missingFields.length > 0) {
    log.error(`Invalid configuration file, missing required fields: ${missingFields.join(', ')}`);
    process.exit(1);
  }
  if (!path.isAbsolute(config.remotePath)) {
    log.error('Invalid configuration file, remotePath must be an absolute path');
    process.exit(1);
  }
}

/**
 * Normalize the configuration
 * Setting default values for optional fields
 * Make the localPath an absolute path
 */
function normalizeConfig(config: t.Config): void {
  config.port = config.port ?? DEFAULT_CONFIG.port;
  config.exclude = config.exclude ?? DEFAULT_CONFIG.exclude;
  config.localPath = path.resolve(process.cwd(), config.localPath);
}
