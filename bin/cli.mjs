#!/usr/bin/env node
import path from 'node:path';
import fs from 'node:fs';
import process from 'node:process';
import prompts from 'prompts';
import { Command } from 'commander';
import SFTPClient from 'ssh2-sftp-client';
import { glob } from 'glob';

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol */


function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

var name = "@iivu/up";
var version = "1.0.0-beta.4";
var description = "up is a command-line tool, which can upload your files to sftp with simple commands.";
var bin = {
	up: "./bin/cli.mjs"
};
var type = "module";
var scripts = {
	build: "rimraf ./bin/* && rollup -c"
};
var keywords = [
	"sftp",
	"upload",
	"command-line"
];
var files = [
	"bin",
	"dist"
];
var author = "Leo Cheung <leozhang621@gmail.com>";
var homepage = "https://github.com/iivu/up#readme";
var repository = {
	type: "git",
	url: "git+https://github.com/iivu/up.git"
};
var bugs = {
	url: "https://github.com/iivu/up/issues"
};
var license = "MIT";
var devDependencies = {
	"@rollup/plugin-json": "^6.1.0",
	"@rollup/plugin-typescript": "^11.1.6",
	"@types/node": "^20.11.20",
	"@types/prompts": "^2.4.9",
	"@types/ssh2-sftp-client": "^9.0.3",
	prettier: "^3.2.5",
	rimraf: "^5.0.5",
	rollup: "^4.12.0",
	tslib: "^2.6.2",
	typescript: "^5.3.3"
};
var dependencies = {
	commander: "^12.0.0",
	glob: "^10.3.10",
	prompts: "^2.4.2",
	"ssh2-sftp-client": "^10.0.3"
};
var pkg = {
	name: name,
	version: version,
	description: description,
	bin: bin,
	type: type,
	scripts: scripts,
	keywords: keywords,
	files: files,
	author: author,
	homepage: homepage,
	repository: repository,
	bugs: bugs,
	license: license,
	devDependencies: devDependencies,
	dependencies: dependencies
};

var host = "<your-sftp-host>";
var port = 22;
var username = "<your-username>";
var password = "<your-password>";
var remotePath = "</your/remote/path>";
var localPath = "</your/local/path>";
var exclude = [
];
var configTemplate = {
	host: host,
	port: port,
	username: username,
	password: password,
	remotePath: remotePath,
	localPath: localPath,
	exclude: exclude
};

function success(msg) {
    console.log('\x1b[32m[SUCCESS] - %s\x1b[0m', msg);
}
function error(msg) {
    console.log('\x1b[31m[ERROR] - %s\x1b[0m', msg);
}
function info(msg) {
    console.log('\x1b[37m[INFO] - %s\x1b[0m', msg);
}
function warn(msg) {
    console.log('\x1b[33m[WARN] - %s\x1b[0m', msg);
}

const DEFAULT_CONFIG = {
    port: 22,
    exclude: [],
};
function parseConfig(configFilePth) {
    info(`Reading configuration from file: ${configFilePth}`);
    if (!fs.existsSync(configFilePth)) {
        error(`Configuration file not found: ${configFilePth}`);
        process.exit(1);
    }
    const config = JSON.parse(fs.readFileSync(configFilePth, 'utf-8'));
    info('Configuration file read successfully, validating the configuration...');
    validateConfig(config);
    normalizeConfig(config);
    return config;
}
function upload(config) {
    return __awaiter(this, void 0, void 0, function* () {
        const localPaths = yield parseLocalPath(config);
        const localDirPathToRemoteMap = mapLocalPathToRemote(localPaths.dirs, config);
        const localFilePathToRemoteMap = mapLocalPathToRemote(localPaths.files, config);
        const client = yield connect(config);
        try {
            const exists = yield client.exists(config.remotePath);
            if (!exists) {
                warn(`Remote path: ${config.remotePath} not exists, creating now...`);
                yield client.mkdir(config.remotePath, true);
            }
            // first create all the directories
            for (const localDirPath of localPaths.dirs) {
                const remoteDirPath = localDirPathToRemoteMap[localDirPath];
                const exists = yield client.exists(remoteDirPath);
                if (!exists) {
                    warn(`Remote path: ${remoteDirPath} not exists, creating now...`);
                    yield client.mkdir(remoteDirPath, true);
                }
            }
            // then upload all the files
            for (const localFilePath of localPaths.files) {
                const remoteFilePath = localFilePathToRemoteMap[localFilePath];
                info(`Uploading: ${localFilePath} -> ${remoteFilePath}`);
                yield client.put(localFilePath, remoteFilePath);
            }
            success(`Upload completed successfully!`);
            process.exit(0);
        }
        catch (e) {
            error(`Remote operation exception: ${e.message}`);
            process.exit(1);
        }
    });
}
function connect(config) {
    return __awaiter(this, void 0, void 0, function* () {
        const client = new SFTPClient('up');
        const connectConfig = { host: config.host, port: config.port, username: config.username, password: config.password };
        try {
            info('Connecting to the server...');
            yield client.connect(connectConfig);
            return client;
        }
        catch (e) {
            error(`Failed to connect to the server: ${e.message}`);
            process.exit(1);
        }
    });
}
/**
 * Parse local file path and return an array of absolute file paths
 * If localPath is a file, return an array with the absolute path of the file
 * If localPath is a directory, return an array with the absolute path of all files in the directory
 * To ignore some file, use the exclude field in the config, which is an array of glob patterns
 */
function parseLocalPath(config) {
    return __awaiter(this, void 0, void 0, function* () {
        // After the parseConfig function, we are sure that localPath is an absolute path
        const localPath = config.localPath;
        if (!fs.existsSync(localPath)) {
            error(`Local path not found: ${localPath}`);
            process.exit(1);
        }
        const fileStat = fs.statSync(localPath);
        if (fileStat.isFile()) {
            return { dirs: [], files: [localPath] };
        }
        if (fileStat.isDirectory()) {
            const allFiles = yield glob(`${localPath}/**/*`, { ignore: config.exclude });
            const result = { dirs: [], files: [] };
            allFiles.forEach((file) => {
                if (fs.statSync(file).isDirectory()) {
                    result.dirs.push(file);
                }
                else {
                    result.files.push(file);
                }
            });
            // ensure that the parent directory comes first
            result.dirs.sort((a, b) => a.length - b.length);
            return result;
        }
        // fileStat is neither a file nor a directory
        error(`Unknown file stat: ${localPath}`);
        process.exit(1);
    });
}
/**
 * Map local file paths to remote file paths
 * For example:
 * If localPath is /home/user/project and remotePath is /var/www/project,
 * and we have a file /home/user/project/index.html,
 * the remote file path will be /var/www/project/index.html
 */
function mapLocalPathToRemote(localPath, config) {
    const result = {};
    localPath.forEach((file) => {
        if (file === config.localPath) {
            // the config.localPath is a file
            const segments = file.split(path.sep);
            result[file] = `${config.remotePath}/${segments[segments.length - 1]}`;
        }
        else {
            // the config.localPath is q directory
            result[file] = file.replace(config.localPath, config.remotePath);
        }
    });
    return result;
}
function validateConfig(config) {
    const requiredFields = ['host', 'username', 'password', 'localPath', 'remotePath'];
    const missingFields = requiredFields.filter((field) => !config[field]);
    if (missingFields.length > 0) {
        error(`Invalid configuration file, missing required fields: ${missingFields.join(', ')}`);
        process.exit(1);
    }
    if (!path.isAbsolute(config.remotePath)) {
        error('Invalid configuration file, remotePath must be an absolute path');
        process.exit(1);
    }
}
/**
 * Normalize the configuration
 * Setting default values for optional fields
 * Make the localPath an absolute path
 */
function normalizeConfig(config) {
    var _a, _b;
    config.port = (_a = config.port) !== null && _a !== void 0 ? _a : DEFAULT_CONFIG.port;
    config.exclude = (_b = config.exclude) !== null && _b !== void 0 ? _b : DEFAULT_CONFIG.exclude;
    config.localPath = path.resolve(process.cwd(), config.localPath);
}

const upConfigFilePath = path.resolve(process.cwd(), './up.config.json');
const command = new Command();
command
    .name('up')
    .version(pkg.version, '-v, --version', 'output the current version')
    .option('-i, --init', 'initialize a new configuration file', false)
    .action((options) => __awaiter(void 0, void 0, void 0, function* () {
    if (options.init) {
        initConfigFile();
    }
    else {
        yield doUpload();
    }
}));
function doUpload() {
    return __awaiter(this, void 0, void 0, function* () {
        const config = parseConfig(upConfigFilePath);
        info(config);
        info('Above is the final configuration to be used for the upload process.');
        const confirm = yield prompts({
            type: 'confirm',
            name: 'value',
            message: 'Confirm the configuration and continue?',
            initial: true,
        });
        if (!confirm.value)
            process.exit(0);
        yield upload(config);
    });
}
function initConfigFile() {
    if (fs.existsSync(upConfigFilePath)) {
        error(`Configuration file already exists: ${upConfigFilePath}`);
        process.exit(1);
    }
    fs.writeFileSync(upConfigFilePath, JSON.stringify(configTemplate, null, 2), { encoding: 'utf-8' });
    success(`Configuration file created: ${upConfigFilePath}`);
    info('Please update the configuration file with the correct values and then run the up again.');
    process.exit(0);
}
command.parse(process.argv);
