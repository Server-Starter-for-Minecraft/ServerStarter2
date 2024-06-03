import { toRaw } from 'vue';
import { deepcopy } from 'app/src-public/scripts/deepcopy';
import { ImageURI } from 'app/src-electron/schema/brands';
import { Remote, RemoteFolder } from 'app/src-electron/schema/remote';
import { tError } from 'src/i18n/utils/tFunc';
import { useMainStore } from 'src/stores/MainStore';
import { checkError } from 'src/components/Error/Error';

export interface GitHubSelecterProp {
  remoteData: RemoteFolder;
}

export interface GithubCheckDialogProp {
  remoteData: RemoteFolder;
  rIcon?: ImageURI;
  rVersionName: string;
  rWorldName: string;
  rLastPlayed: number;
}

export async function setRemoteWorld(rWorld: Remote, isExist: boolean) {
  const mainStore = useMainStore();

  // ready world object
  const world = deepcopy(mainStore.world);
  world.remote = rWorld;
  if (isExist) {
    world.remote_source = rWorld;
  }

  // save data
  const res = await window.API.invokeSetWorld(toRaw(world));
  checkError(
    res.value,
    (w) => mainStore.updateWorld(w),
    (e) =>
      tError(e, {
        titleKey: 'error.errorDialog.failSync',
        descKey: `error.${e.key}.title`,
      })
  );

  return res;
}
