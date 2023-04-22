import { checkError } from "./components/Error/Error";
import { useMainStore } from "./stores/MainStore";

export async function InitWindow() {
  // storeの初期化
  const worlds = await window.API.invokeGetAllWorlds()
  checkError(
    worlds,
    (checked) => useMainStore().worldList = checked
  )
}