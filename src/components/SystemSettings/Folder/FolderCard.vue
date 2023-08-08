<script setup lang="ts">
import { getCssVar, useQuasar } from 'quasar';
import { WorldContainerSetting } from 'app/src-electron/schema/system';
import { useSystemStore } from 'src/stores/SystemStore';
import { AddFolderDialogProps, AddFolderDialogReturns } from './iAddFolder';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import AddFolderDialog from 'src/components/SystemSettings/Folder/AddFolderDialog.vue';

interface Prop {
  loading?: boolean
  showOperationBtns?: boolean
  active?: boolean
  onClick?: () => void
}
defineProps<Prop>()
const folder = defineModel<WorldContainerSetting>({ required: true })

const $q = useQuasar()
const sysStore = useSystemStore()

function switchVisible() {
  return folder.value.visible = !folder.value.visible
}

function editFolder() {
  $q.dialog({
    component: AddFolderDialog,
    componentProps: {
      containerSettings: folder.value
    } as AddFolderDialogProps
  }).onOk((payload: AddFolderDialogReturns) => {
    folder.value.name = payload.name
    folder.value.container = payload.container
  })
}

function removeFolder() {
  sysStore.systemSettings.container.splice(
    sysStore.systemSettings.container.map(c => c.name).indexOf(folder.value.name), 1
  )
}
</script>

<template>
  <q-card
    flat
    bordered 
    :style="{ 'border-color': active ? getCssVar('primary') : 'transparent' }"
  >
    <q-item
      :clickable="onClick !== void 0"
      :active="active"
      :disable="loading"
      @click="onClick"
    >
      <q-item-section>
        <div class="text-omit" style="font-size: 1.1rem;">{{ folder.name }}</div>
        <div class="text-caption text-omit" style="opacity: .6;">{{ folder.container }}</div>
      </q-item-section>
  
      <q-item-section side>
        <div class="row q-gutter-sm">
          <ss-btn
            dense
            free-width
            :icon="folder.visible ? 'visibility' : 'visibility_off'"
            :disable="sysStore.systemSettings.container.filter(c => c.visible).length === 1 && folder.visible"
            @click="switchVisible"
          >
            <q-tooltip>
              ワールド一覧にこのフォルダに保存されたワールドを表示{{ folder.visible ? 'する' : 'しない' }}
            </q-tooltip>
          </ss-btn>
          <ss-btn
            v-show="showOperationBtns && folder.name !== 'default'"
            free-width
            label="編集"
            @click="editFolder"
          />
          <ss-btn
            v-show="showOperationBtns"
            free-width
            label="削除"
            color="red"
            :disable="sysStore.systemSettings.container.length === 1"
            @click="removeFolder"
          />
        </div>
      </q-item-section>

      <div class="absolute-center">
        <q-circular-progress
          v-show="loading"
          indeterminate
          rounded
          size="40px"
          color="primary"
          class="q-ma-md"
        />
      </div>
    </q-item>
  </q-card>
</template>