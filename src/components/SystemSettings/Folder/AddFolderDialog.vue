<script setup lang="ts">
import { ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { AddFolderDialogProps, AddFolderDialogReturns } from './iAddFolder';
import { useSystemStore } from 'src/stores/SystemStore';
import BaseDialogCard from 'src/components/util/baseDialog/baseDialogCard.vue';
import SsInput from 'src/components/util/base/ssInput.vue';
import SsBtn from 'src/components/util/base/ssBtn.vue';

const prop = defineProps<AddFolderDialogProps>()
defineEmits({...useDialogPluginComponent.emitsObject})
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()

const sysStore = useSystemStore()
const inputName = ref(prop.containerSettings?.name ?? '')
const pickPath = ref(prop.containerSettings?.container ?? '')

function pickFolder() {
  // TODO: Pickerの実装が完了し次第、作成
}
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <BaseDialogCard
      title="ワールドフォルダを追加"
      :disable="sysStore.systemSettings.container.filter(c => c.name === inputName && inputName !== prop.containerSettings?.name).length > 0 || inputName === '' || pickPath === ''"
      :ok-btn-txt="`${inputName}を追加`"
      @ok-click="onDialogOK({ name: inputName, container: pickPath } as AddFolderDialogReturns)"
      @close="onDialogCancel"
    >
      <div class="row q-gutter-md">
        <SsInput
          v-model="inputName"
          label="ワールドフォルダ名"
          class="col"
        />
        <SsBtn
          free-width
          label="フォルダを選択"
          @click="pickFolder"
        />
      </div>
      
      <div
        v-show="sysStore.systemSettings.container.filter(c => c.name === inputName && inputName !== prop.containerSettings?.name).length > 0"
        class="text-caption text-omit text-red q-pt-sm"
      >
        {{ inputName }}は既に存在します
      </div>
      <div
        v-show="inputName === ''"
        class="text-caption text-omit text-red q-pt-sm"
      >
        フォルダ名を入力してください
      </div>
      <div
        v-show="pickPath === ''"
        class="text-caption text-omit text-red q-pt-sm"
      >
        フォルダを選択してください
      </div>
      <div 
        v-show="pickPath !== ''"
        class="text-caption text-omit q-pt-sm"
        style="opacity: .6;"
      >
        {{ pickPath }}
      </div>
    </BaseDialogCard>
  </q-dialog>
</template>