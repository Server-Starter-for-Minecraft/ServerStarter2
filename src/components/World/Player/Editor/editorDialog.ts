import { toRaw } from "vue";
import { PlayerUUID } from "app/src-electron/schema/brands";
import { useSystemStore } from "src/stores/SystemStore";

export interface iEditorDialogProps {
  groupName?: string
  groupColor?: string
  members: PlayerUUID[]
}

export interface iEditorDialogReturns {
  name: string,
  color: string,
  members: PlayerUUID[]
}

/**
 * グループの新規作成時に使用する作成器 
 */
export function generateGroup(name: string, colorCode: string, members: PlayerUUID[]) {
  const sysStore = useSystemStore()
  sysStore.systemSettings().player.groups[name] = {
    name: name,
    color: colorCode,
    players: toRaw(members)
  }
}