import { OsPlatform } from 'app/src-electron/util/os';

export interface UpdateNotifyProp {
  os: OsPlatform;
  newVer: string;
}
