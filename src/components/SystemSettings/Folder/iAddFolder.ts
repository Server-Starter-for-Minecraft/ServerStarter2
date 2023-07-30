import { WorldContainer } from "app/src-electron/schema/brands"
import { WorldContainerSetting } from "app/src-electron/schema/system"

export interface AddFolderDialogProps {
  containerSettings?: WorldContainerSetting
}

export interface AddFolderDialogReturns {
  name: string
  container: WorldContainer
}