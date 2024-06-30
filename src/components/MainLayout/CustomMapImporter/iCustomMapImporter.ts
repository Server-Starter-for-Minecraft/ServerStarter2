import { toRaw } from 'vue';
import { deepcopy } from 'app/src-public/scripts/deepcopy';
import { ImageURI } from 'app/src-electron/schema/brands';
import { CustomMapData } from 'app/src-electron/schema/filedata';
import { assets } from 'src/assets/assets';
import { tError } from 'src/i18n/utils/tFunc';
import { useMainStore } from 'src/stores/MainStore';
import { createNewWorld, updateWorld } from 'src/stores/WorldStore';
import { checkError } from 'src/components/Error/Error';

export interface CustomMapImporterProp {
  icon?: ImageURI;
  worldName: string;
  versionName: string;
  importFunc: () => Promise<void>;
}

export async function importCustomMap(customMap: CustomMapData) {
  const mainStore = useMainStore();

  // set icon
  if (customMap.icon === void 0) {
    customMap.icon = assets.png.unset;
  }

  // ready world object
  await createNewWorld();
  const world = deepcopy(mainStore.world);

  if (world) {
    world.custom_map = toRaw(customMap);

    // save data
    const res = await window.API.invokeSetWorld(toRaw(world));
    checkError(
      res.value,
      (w) => updateWorld(w),
      (e) =>
        tError(e, {
          titleKey: 'error.errorDialog.failToSaveExistedWorld',
          descKey: `error.${e.key}.title`,
        })
    );
  }
}
