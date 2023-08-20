<script setup lang="ts">
import DangerView from 'src/components/util/danger/dangerView.vue';
import { values } from 'src/scripts/obj';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore, useWorldStore } from 'src/stores/MainStore';
import { moveScrollTop_Home } from '../scroll';
import { checkError } from 'src/components/Error/Error';
import { useI18n } from 'vue-i18n';

const { t } = useI18n()
const mainStore = useMainStore()
const worldStore = useWorldStore()
const consoleStore = useConsoleStore()

/**
 * 選択されているワールドを削除する
 */
async function removeWorld() {
  /** 描画の更新 */
  function updateView() {

    // 描画上のリストから削除
    mainStore.removeWorld()

    // ワールドが消失した場合は、新規ワールドを自動生成
    if (values(worldStore.worldList).length === 0) {
      mainStore.createNewWorld()
    }

    // ワールドリストの0番目を表示
    const worlds = values(worldStore.sortedWorldList)
    mainStore.setWorld(worlds[worlds.length - 1])

    // 画面を一番上に
    moveScrollTop_Home()
  }

  const res = await window.API.invokeDeleteWorld(mainStore.selectedWorldID)
  checkError(
    res.value,
    updateView,
    () => { return { title: t('home.error.failedDelete', { serverName: mainStore.world.name }) } }
  )
}
</script>

<template>
  <DangerView
    :view-title="$t('home.deleteWorld.title')"
    :view-desc="$t('home.deleteWorld.titleDesc')"
    :open-dialog-btn-text="$t('home.deleteWorld.button')"
    :dialog-title="$t('home.deleteWorld.dialogTitle')"
    :dialog-desc="$t('home.deleteWorld.dialogDesc', { deleteName: mainStore.world.name })"
    :disable="consoleStore.status(mainStore.world.id) !== 'Stop'"
    @action="removeWorld"
  />
</template>