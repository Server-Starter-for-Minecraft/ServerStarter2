import { CustomMapData } from "app/src-electron/schema/filedata";
import { deepcopy } from "app/src-electron/util/deepcopy";
import { checkError } from "src/components/Error/Error";
import { useMainStore } from "src/stores/MainStore";

export interface CustomMapImporterProp {
  customMap: CustomMapData
}

export async function importCustomMap(customMap: CustomMapData) {
  const mainStore = useMainStore()
  
  // ready world object
  const world = deepcopy(mainStore.world)
  world.custom_map = customMap

  // save data
  const res = await window.API.invokeSetWorld(world)

  checkError(
    res.value,
    undefined,
    () => { return { title: '配布ワールドの保存に失敗しました'}}
  )
}