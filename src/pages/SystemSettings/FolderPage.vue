<script setup lang="ts">
import { useQuasar } from 'quasar';
import { getWorlds } from 'src/init';
import { WorldContainer } from 'app/src-electron/schema/brands';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useSystemStore } from 'src/stores/SystemStore';
import { registAbbrWorld } from 'src/stores/WorldStore';
import { AddFolderDialogReturns } from 'src/components/SystemSettings/Folder/iAddFolder';
import AddContentsCard from 'src/components/util/AddContentsCard.vue';
import AddFolderDialog from 'src/components/SystemSettings/Folder/AddFolderDialog.vue';
import FolderCard from 'src/components/SystemSettings/Folder/FolderCard.vue';

const $q = useQuasar();
const sysStore = useSystemStore();
const consoleStore = useConsoleStore();

function openFolderEditor() {
  $q.dialog({
    component: AddFolderDialog,
  }).onOk((payload: AddFolderDialogReturns) => {
    sysStore.systemSettings.container.push({
      name: payload.name,
      visible: true,
      container: payload.container,
    });
    // 追加したワールドフォルダをワールド一覧に追加
    loadFolderWorlds(payload.container);
  });
}

async function loadFolderWorlds(container: WorldContainer) {
  const abbrs = await window.API.invokeGetWorldAbbrs(container);
  abbrs.value.forEach((abbr) => registAbbrWorld(abbr));
  getWorlds(abbrs.value.map((abbr) => abbr.id));
}
</script>

<template>
  <div class="q-pa-md">
    <p class="q-my-sm text-body2" style="opacity: 0.6">
      {{ $t('others.worldFolder.description') }}
    </p>
    <p
      v-if="!consoleStore.isAllWorldStop()"
      class="q-my-sm text-body2 text-negative"
    >
      {{ $t('others.worldFolder.cannotEdit') }}
    </p>

    <div class="column q-py-sm q-gutter-y-md">
      <template
        v-for="n in sysStore.systemSettings.container.length"
        :key="sysStore.systemSettings.container[n - 1]"
      >
        <FolderCard
          show-operation-btns
          v-model="sysStore.systemSettings.container[n - 1]"
          :disable="!consoleStore.isAllWorldStop()"
        />
      </template>
      <AddContentsCard
        :label="$t('others.worldFolder.addFolder')"
        min-height="4rem"
        :card-style="{ 'min-width': '100%', 'border-radius': '5px' }"
        @click="openFolderEditor"
      />
    </div>
  </div>
</template>
