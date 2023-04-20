import { Version } from 'app/src-electron/api/scheme';
import { Path } from '../../utils/path/path';
import { JavaComponent } from './vanilla';
import { Failable } from '../../utils/result';

export type VersionLoader = {
  readyVersion(
    version: Version
  ): Promise<Failable<{ jarpath: Path; component: JavaComponent }>>;
};
