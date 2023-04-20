import { useMainStore } from "./stores/MainStore";

export async function InitWindow() {
  // storeの初期化
  const result = await window.API.invokeGetAllWorlds()
  if (!(result instanceof Error)) { useMainStore().worldList = result }
}