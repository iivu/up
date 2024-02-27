export type ConnectConfig = {
  host: string;
  port?: number;
  username: string;
  password: string;
};

export type UploadConfig = {
  localPath: string;
  remotePath: string;
  exclude?: string[];
};

export type Config = ConnectConfig & UploadConfig;
