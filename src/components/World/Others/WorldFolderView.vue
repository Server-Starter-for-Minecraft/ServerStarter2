<script setup lang="ts">
import { ref, toRaw } from 'vue';
import { useQuasar } from 'quasar';
import { WorldContainer } from 'app/src-electron/schema/brands';
import { deepcopy } from 'app/src-electron/util/deepcopy';
import { tError } from 'src/i18n/utils/tFunc';
import { useSystemStore } from 'src/stores/SystemStore';
import { useMainStore, useWorldStore } from 'src/stores/MainStore';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { checkError } from 'src/components/Error/Error';
import { AddFolderDialogReturns } from 'src/components/SystemSettings/Folder/iAddFolder';
import { values } from 'src/scripts/obj';
import AddContentsCard from 'src/components/util/AddContentsCard.vue';
import AddFolderDialog from 'src/components/SystemSettings/Folder/AddFolderDialog.vue';
import FolderCard from 'src/components/SystemSettings/Folder/FolderCard.vue';

const $q = useQuasar();
const sysStore = useSystemStore();
const mainStore = useMainStore();
const worldStore = useWorldStore();
const consoleStore = useConsoleStore();

const isWorldContainerLoading = ref(false);

/**
 * ワールドフォルダの表示非表示を変更するときに、
 * 表示ワールドを残ったワールド一覧から選択する
 */
function changeVisible(container: WorldContainer) {
  console.log(mainStore.world.container);
  if (mainStore.world.container === container) {
    const world = values(worldStore.sortedWorldList);
    mainStore.setWorld(world[world.length - 1]);
  }
}

/**
 * ワールドコンテナをセットする際に、データの移動を待機する
 */
async function setWorldContainer(container: WorldContainer) {
  // エラーの起きているワールドということにしてワールドの起動を阻止する
  mainStore.errorWorlds.add(mainStore.world.id);
  isWorldContainerLoading.value = true;

  const world = deepcopy(mainStore.world);
  world.container = container;

  // 保存処理を実行
  const res = await window.API.invokeSetWorld(toRaw(world));
  checkError(
    res.value,
    (w) => mainStore.updateWorld(w),
    (e) => tError(e)
  );

  // エラー状態の解除
  mainStore.errorWorlds.delete(world.id);
  isWorldContainerLoading.value = false;
}

/**
 * ワールドコンテナの新規作成Dialog
 */
function openFolderEditor() {
  $q.dialog({
    component: AddFolderDialog,
  }).onOk((payload: AddFolderDialogReturns) => {
    sysStore.systemSettings.container.push({
      name: payload.name,
      visible: true,
      container: payload.container,
    });
  });
}
</script>

<template>
  <p class="text-caption" style="opacity: 0.6">
    {{ $t('others.worldFolder.description') }}
  </p>
  <div class="column q-gutter-y-md">
    <!-- v-modelの書き込みに対応するため、わざとインデックスによる呼び出しを利用 -->
    <template
      v-for="n in sysStore.systemSettings.container.length"
      :key="sysStore.systemSettings.container[n - 1]"
    >
      <FolderCard
        v-model="sysStore.systemSettings.container[n - 1]"
        :loading="isWorldContainerLoading"
        :disable="consoleStore.status(mainStore.world.id) !== 'Stop'"
        :active="
          mainStore.world.container ===
          sysStore.systemSettings.container[n - 1].container
        "
        @click="
          setWorldContainer(sysStore.systemSettings.container[n - 1].container)
        "
        @visible-click="
          changeVisible(sysStore.systemSettings.container[n - 1].container)
        "
      />
    </template>
    <AddContentsCard
      :label="$t('others.worldFolder.addFolder')"
      min-height="3rem"
      :card-style="{ 'min-width': '100%', 'border-radius': '5px' }"
      @click="openFolderEditor"
    />
  </div>
</template>
