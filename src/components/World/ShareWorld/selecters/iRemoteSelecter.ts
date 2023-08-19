import { toRaw } from "vue";
import { ImageURI } from "app/src-electron/schema/brands";
import { Remote, RemoteFolder } from "app/src-electron/schema/remote";
import { deepcopy } from "app/src-electron/util/deepcopy";
import { checkError } from "src/components/Error/Error";
import { useMainStore } from "src/stores/MainStore";
import { tError } from "src/i18n/utils/tFunc";

export interface GitHubSelecterProp {
  remoteData: RemoteFolder
}

export interface GithubCheckDialogProp {
  remoteData: RemoteFolder
  rIcon?: ImageURI
  rVersionName: string
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
    e => tError(e)
    //() => { return { title: 'ShareWorldの同期に失敗しました' }}
  )

  return res
}