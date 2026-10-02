<script setup lang="ts">
import { tError } from 'src/i18n/utils/tFunc';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';
import { useSystemStore } from 'src/stores/SystemStore';
import { createNewWorld, removeWorld } from 'src/stores/WorldStore';
import { checkError } from 'src/components/Error/Error';
import DangerView from 'src/components/util/danger/dangerView.vue';
import { moveScrollTop_Home } from '../scroll';
import { nextWorldAfterDeletion } from './worldDeletion';

const mainStore = useMainStore();
const consoleStore = useConsoleStore();
const sysStore = useSystemStore();

/**
 * 選択されているワールドを削除する
 */
async function removeWorld_Clicked() {
  /** 描画の更新 */
  async function updateView() {
    // 表示ワールドの変更に対応できるよう、削除するWorldIDを控えておく
    const removeWorldID = mainStore.selectedWorldID;

    // 削除後に表示するワールドを、表示中のワールドフォルダに属するワールドから選ぶ
    const nextWorldID = nextWorldAfterDeletion(
      mainStore.allWorlds.readonlyWorlds,
      sysStore.systemSettings.container,
      removeWorldID
    );

    // 表示できるワールドが無くなる場合は、新規ワールドを自動生成
    if (nextWorldID === undefined) {
      // 削除する際にworldStore.worldListが更新されてSetWorldが呼ばれるため、
      // 表示しているワールドを確実にNewWorld側にしてから削除処理を実行
      // このためには、削除前にCreateNewWorldする必要あり
      await createNewWorld();
    }

    // 描画上のリストから削除
    removeWorld(removeWorldID);

    // 残っているワールドを表示（新規ワールドを生成した場合は生成時に表示済み）
    if (nextWorldID !== undefined) {
      mainStore.showWorld(
        mainStore.allWorlds.readonlyWorlds[nextWorldID].world
      );
    }

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
        deleteName: splitName(
          mainStore.allWorlds.readonlyWorlds[mainStore.selectedWorldID]?.world
            .name ?? ''
        ),
      })
    "
    :disable="consoleStore.status(mainStore.selectedWorldID) !== 'Stop'"
    @action="removeWorld_Clicked"
  />
</template>
