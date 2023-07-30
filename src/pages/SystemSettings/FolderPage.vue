<script setup lang="ts">
import { useQuasar } from 'quasar';
import { useSystemStore } from 'src/stores/SystemStore';
import { AddFolderDialogReturns } from 'src/components/SystemSettings/Folder/iAddFolder';
import FolderCard from 'src/components/SystemSettings/Folder/FolderCard.vue';
import AddFolderDialog from 'src/components/SystemSettings/Folder/AddFolderDialog.vue';
import AddContentsCard from 'src/components/util/AddContentsCard.vue';

const $q = useQuasar()
const sysStore = useSystemStore()

function openFolderEditor() {
  $q.dialog({
    component: AddFolderDialog
  }).onOk((payload: AddFolderDialogReturns) => {
    sysStore.systemSettings.container.push({
      name: payload.name,
      visible: true,
      container: payload.container
    })
  })
}
</script>

<template>
  <div class="q-pa-md">
    <p class="q-my-sm text-body2" style="opacity: .6;">
      ワールドデータの保存先を設定
    </p>

    <div class="column q-py-sm q-gutter-y-md">
      <template v-for="n in sysStore.systemSettings.container.length" :key="sysStore.systemSettings.container[n-1]">
        <FolderCard show-operation-btns v-model="sysStore.systemSettings.container[n - 1]" />
      </template>
      <AddContentsCard
        label="ワールドフォルダを追加"
        min-height="4rem"
        :card-style="{'min-width': '100%', 'border-radius': '5px'}"
        @click="openFolderEditor"
      />
    </div>
  </div>
</template>