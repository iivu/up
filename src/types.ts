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
  /**
   * Glob patterns for files that should be uploaded first.
   * Files are sorted according to the order of patterns in this array.
   */
  priority?: string[];
  /**
   * Glob patterns for files that should be uploaded last.
   * Defaults to matching all `.html` files so HTML entry files are uploaded after static assets.
   */
  priorityLast?: string[];
};

export type Config = ConnectConfig & UploadConfig;
