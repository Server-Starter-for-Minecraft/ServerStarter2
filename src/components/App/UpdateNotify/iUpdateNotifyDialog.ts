import { OsPlatform } from 'app/src-electron/schema/os';

export interface UpdateNotifyProp {
  os: OsPlatform;
  newVer: string;
}
