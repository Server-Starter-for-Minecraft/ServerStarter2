import { checkError } from "./components/Error/Error";
import { useMainStore } from "./stores/MainStore";

export async function InitWindow() {
  // storeの初期化
  const worldContainers = await window.API.invokeGetWorldContainers()
  // TODO: world情報の取得
  console.log(worldContainers)

  // checkError(
  //   worldContainers,
  //   (checked) => useMainStore().worldList = checked
  // )
}