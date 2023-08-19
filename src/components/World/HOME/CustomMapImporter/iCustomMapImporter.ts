import { toRaw } from "vue";
import { CustomMapData } from "app/src-electron/schema/filedata";
import { deepcopy } from "app/src-electron/util/deepcopy";
import { checkError } from "src/components/Error/Error";
import { useMainStore } from "src/stores/MainStore";
import { assets } from "src/assets/assets";
import { tError } from "src/i18n/utils/tFunc";

export interface CustomMapImporterProp {
  customMap: CustomMapData
}

export async function importCustomMap(customMap: CustomMapData) {
  const mainStore = useMainStore()

  // set icon
  if (customMap.icon === void 0) {
    customMap.icon = assets.png.unset
  }
  
  // ready world object
  const world = deepcopy(mainStore.world)
  world.custom_map = toRaw(customMap)

  // save data
  const res = await window.API.invokeSetWorld(toRaw(world))
  checkError(
    res.value,
    w => mainStore.updateWorld(w),
    e => tError(e)
    //() => { return { title: '配布ワールドの保存に失敗しました'}}
  )
}