import { GitRemote } from 'app/src-electron/api/schema';
import { RemoteOperator } from './base';

const gitOperator: RemoteOperator<GitRemote> = {
  async pull(local, remote) {
  },
  push() {},
};
