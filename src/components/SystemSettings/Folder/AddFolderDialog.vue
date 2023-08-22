<script setup lang="ts">
import { ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { WorldContainer } from 'app/src-electron/schema/brands';
import { checkError } from 'src/components/Error/Error';
import { useSystemStore } from 'src/stores/SystemStore';
import { AddFolderDialogProps, AddFolderDialogReturns } from './iAddFolder';
import BaseDialogCard from 'src/components/util/baseDialog/baseDialogCard.vue';
import SsInput from 'src/components/util/base/ssInput.vue';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import { tError } from 'src/i18n/utils/tFunc';

const prop = defineProps<AddFolderDialogProps>()
defineEmits({...useDialogPluginComponent.emitsObject})
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()

const sysStore = useSystemStore()
const inputName = ref(prop.containerSettings?.name ?? '')
const pickPath = ref(prop.containerSettings?.container ?? '' as WorldContainer)

async function pickFolder() {
  const res = await window.API.invokePickDialog({ type: 'container' })
  checkError(
    res,
    c => pickPath.value = c,
    e => tError(e, {ignoreErrors:['data.path.dialogCanceled']})
  )
}
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <BaseDialogCard
      :title="$t('home.saveWorld.addFolder')"
      :disable="
        sysStore.systemSettings.container.filter(
          c => c.name === inputName && inputName !== containerSettings?.name
        ).length > 0
          || sysStore.systemSettings.container.map(c => c.container).includes(pickPath)
          || inputName === ''
          || pickPath === ''
      "
      :ok-btn-txt="$t('home.saveWorld.add', { name: inputName })"
      @ok-click="onDialogOK({ name: inputName, container: pickPath } as AddFolderDialogReturns)"
      @close="onDialogCancel"
    >
      <div class="row q-gutter-md">
        <SsInput
          v-model="inputName"
          :label="$t('home.saveWorld.folderName')"
          autofocus
          class="col"
        />
        <SsBtn
          free-width
          :label="$t('home.saveWorld.selectFolderBtn')"
          @click="pickFolder"
        />
      </div>
      
      <div
        v-show="sysStore.systemSettings.container.filter(c => c.name === inputName && inputName !== prop.containerSettings?.name).length > 0"
        class="text-caption text-omit text-red q-pt-sm"
      >
        {{ $t('home.saveworld.exist',{ name: inputName }) }}
      </div>
      <div
        v-show="inputName === ''"
        class="text-caption text-omit text-red q-pt-sm"
      >
        {{ $t('home.saveWorld.inputFolderName') }}
      </div>
      <div
        v-show="pickPath === ''"
        class="text-caption text-omit text-red q-pt-sm"
      >
        {{ $t('home.saveWorld.selectFolder') }}
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