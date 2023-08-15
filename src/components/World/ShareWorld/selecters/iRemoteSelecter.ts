import { toRaw } from "vue";
import { Remote, RemoteFolder } from "app/src-electron/schema/remote";
import { deepcopy } from "app/src-electron/util/deepcopy";
import { checkError } from "src/components/Error/Error";
import { useMainStore } from "src/stores/MainStore";

export interface GitHubSelecterProp {
  remoteData: RemoteFolder
}

export interface GithubCheckDialogProp {
  remoteData: RemoteFolder
  rWorldName: string
}

export async function setRemoteWorld(rWorld: Remote, isExist: boolean) {
  const mainStore = useMainStore()
  
  // ready world object
  const world = deepcopy(mainStore.world)
  world.remote = rWorld
  if (isExist) {
    world.remote_source = rWorld
  }

  // save data
  const res = await window.API.invokeSetWorld(toRaw(world))
  checkError(
    res.value,
    w => mainStore.updateWorld(w),
    () => { return { title: 'ShareWorldの同期に失敗しました' }}
  )

  return res
}