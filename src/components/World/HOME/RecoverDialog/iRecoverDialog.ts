import { BackupData } from "app/src-electron/schema/filedata";
import { WorldID } from "app/src-electron/schema/world";

export interface RecoverDialogProp {
  worldID: WorldID
  backupData: BackupData
}