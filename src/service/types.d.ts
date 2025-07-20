export type File = {
  name: string;
  fid: string;
  isDirectory: boolean;
  lastUpdateAt: string;
  size: number;
  sync?: boolean;
};
