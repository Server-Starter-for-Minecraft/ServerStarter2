import { useMainStore } from "./stores/MainStore";
import { checkError } from "./stores/ErrorStore";

export async function InitWindow() {
  // storeの初期化
  const worlds = await window.API.invokeGetAllWorlds()
  checkError(
    worlds,
    (checked) => useMainStore().worldList = checked
  )
}