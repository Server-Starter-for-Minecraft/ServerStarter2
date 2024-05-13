<script setup lang="ts">
import { values } from 'src/scripts/obj';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore, useWorldStore } from 'src/stores/MainStore';
import { moveScrollTop_Home } from '../scroll';
import { checkError } from 'src/components/Error/Error';
import { tError } from 'src/i18n/utils/tFunc';
import DangerView from 'src/components/util/danger/dangerView.vue';

const mainStore = useMainStore();
const worldStore = useWorldStore();
const consoleStore = useConsoleStore();

/**
 * 選択されているワールドを削除する
 */
async function removeWorld() {
  /** 描画の更新 */
  async function updateView() {
    // 表示ワールドの変更に対応できるよう、削除するWorldIDを控えておく
    const removeWorldID = mainStore.selectedWorldID;

    // ワールドが消失する場合は、新規ワールドを自動生成
    if (values(mainStore.showingWorldList).length === 1) {
      // 削除する際にworldStore.worldListが更新されてSetWorldが呼ばれるため、
      // 表示しているワールドを確実にNewWorld側にしてから削除処理を実行
      // このためには、削除前にCreateNewWorldする必要あり
      await mainStore.createNewWorld();
    }

    // 描画上のリストから削除
    mainStore.removeWorld(removeWorldID);

    // ワールドリストの0番目を表示
    const world = values(worldStore.sortedWorldList);
    mainStore.setWorld(world[world.length - 1]);

    // 画面を一番上に
    moveScrollTop_Home();
  }

  const res = await window.API.invokeDeleteWorld(mainStore.selectedWorldID);
  checkError(res.value, updateView, (e) => tError(e));
}

function splitName(name: string) {
  const maxLength = 20;
  return name.length > maxLength ? `${name.slice(0, maxLength)}...` : name;
}
</script>

<template>
  <DangerView
    :view-title="$t('home.deleteWorld.title')"
    :view-desc="$t('home.deleteWorld.titleDesc')"
    :open-dialog-btn-text="$t('home.deleteWorld.button')"
    :dialog-title="$t('home.deleteWorld.dialogTitle')"
    :dialog-desc="
      $t('home.deleteWorld.dialogDesc', {
        deleteName: splitName(mainStore.world.name),
      })
    "
    :disable="consoleStore.status(mainStore.world.id) !== 'Stop'"
    @action="removeWorld"
  />
</template>
