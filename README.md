# up
`up` is a command-line tool, which can upload your files to sftp with simple commands.

# Usage

## Install
```bash
npm install -g up
```
use `yarn`/`pnpm` whatever you like.

## Setup configuration file
`up` will read configuration file from `up.config.json` in your working directory.<br> 
You can use `up --init` to create a configuration file.<br>
Below is a complete example of `up.config.json`:
```json
{
  "host": "your-sftp-host",
  "port": 22,
  "username": "your-username",
  "password": "your-password",
  "remotePath": "/your/remote/path",
  "localPath": "/your/local/path",
  "exclude": []
}
```

## Configuration fields
- `host`(required): the sftp host
- `port`: the sftp port, default is `22`
- `username`(required): the sftp username
- `password`(required): the sftp password
- `remotePath`(required): the remote dir path you want to upload to, should be an absolute path.
- `localPath`(required): the local file path you want to upload, can be relative or absolute, finally this path will be resolved to an absolute path
- `exclude`: the files you want to exclude, should be an array of string, the string should be a glob pattern, like `['**/*.log', 'node_modules']`
<br>

**if `localPath` is a directory, `up` will upload all files in the directory, for example:**
<br>
**`/your/local/path` is a directory, and it contains files like: `/your/local/path/example.txt`, `remotePath` is `/var/www/project`, when upload finished, the remote file url will be `/var/www/project/example.txt`**
<br>

**if `localPath` is a file, `up` will directly upload the file to the `remotePath`, for example**
<br>
**`/your/local/example.txt` is a file, `remotePath` is `/var/www/project`, when upload finished, the remote file url will be `/var/www/project/example.txt`**

## Commands and options
- `up`: upload files to sftp, use the working directory's `up.config.json` as configuration file.
  - `-h, --help`: output usage information
  - `-v, --version`: output the version number
  - `-i, --init`: create a template of configuration file in the working directory

## License
MIT

