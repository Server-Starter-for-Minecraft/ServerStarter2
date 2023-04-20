import { Version } from 'app/src-electron/api/scheme';
import { Path } from '../../utils/path/path';
import { JavaComponent } from './vanilla';
import { Failable } from '../../../api/failable';

export type VersionLoader = {
  readyVersion(version: Version): Promise<
    Failable<{
      programArguments: string[];
      serverCwdPath: Path;
      component: JavaComponent;
    }>
  >;
  getAllVersions(): Promise<Failable<Version[]>>;
};
