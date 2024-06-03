<script setup lang="ts">
import { ref, toRaw } from 'vue';
import { useQuasar } from 'quasar';
import { WorldContainer } from 'app/src-electron/schema/brands';
import { deepcopy } from 'src/scripts/deepcopy';
import { tError } from 'src/i18n/utils/tFunc';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';
import { useSystemStore } from 'src/stores/SystemStore';
import { checkError } from 'src/components/Error/Error';
import { AddFolderDialogReturns } from 'src/components/SystemSettings/Folder/iAddFolder';
import SsSelectScope from 'src/components/util/base/ssSelectScope.vue';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';
import AddFolderDialog from 'src/components/SystemSettings/Folder/AddFolderDialog.vue';

const $q = useQuasar();
const sysStore = useSystemStore();
const mainStore = useMainStore();
const consoleStore = useConsoleStore();

const selecterOptions = sysStore.systemSettings.container.map((c) => {
  return {
    label: `${c.name} (${c.container})`,
    name: c.name,
    value: c.container,
  };
});
const isWorldContainerLoading = ref(false);

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

  <div class="row q-gutter-x-md">
    <SsSelectScope
      v-model="mainStore.noSubscribeWorld.container"
      @update:model-value="(newVal: WorldContainer) => setWorldContainer(newVal)"
      :options="selecterOptions"
      option-label="label"
      option-value="value"
      :loading="isWorldContainerLoading"
      :disable="
        isWorldContainerLoading ||
        consoleStore.status(mainStore.world.id) !== 'Stop'
      "
      class="col"
    >
      <template v-slot:option="scope">
        <q-item v-bind="scope.itemProps">
          <q-item-section>
            <q-item-label>{{ scope.opt.name }}</q-item-label>
            <q-item-label caption>{{ scope.opt.value }}</q-item-label>
          </q-item-section>
        </q-item>
      </template>
    </SsSelectScope>

    <q-btn outline icon="add" @click="openFolderEditor()">
      <SsTooltip
        :name="$t('others.worldFolder.addFolder')"
        anchor="bottom middle"
        self="center middle"
      />
    </q-btn>

    <q-btn outline icon="settings" @click="$router.push('/system/folder')">
      <SsTooltip
        :name="$t('others.worldFolder.openSettings')"
        anchor="bottom middle"
        self="center middle"
      />
    </q-btn>
  </div>
</template>
