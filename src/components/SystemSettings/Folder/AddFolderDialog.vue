<script setup lang="ts">
import { ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { WorldContainer } from 'app/src-electron/schema/brands';
import { WorldContainerSetting } from 'app/src-electron/schema/system';
import { tError, omitPath } from 'src/i18n/utils/tFunc';
import { checkError } from 'src/components/Error/Error';
import { useSystemStore } from 'src/stores/SystemStore';
import { AddFolderDialogProps, AddFolderDialogReturns } from './iAddFolder';
import BaseDialogCard from 'src/components/util/baseDialog/baseDialogCard.vue';
import SsInput from 'src/components/util/base/ssInput.vue';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';

const prop = defineProps<AddFolderDialogProps>()
defineEmits({ ...useDialogPluginComponent.emitsObject })
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()

const sysStore = useSystemStore()
const inputName = ref(prop.containerSettings?.name ?? '')
const pickPath = ref(prop.containerSettings?.container ?? '' as WorldContainer)

async function pickFolder() {
  const res = await window.API.invokePickDialog({ type: 'container' })
  checkError(
    res,
    c => pickPath.value = c,
    e => tError(e, { ignoreErrors: ['data.path.dialogCanceled'] })
  )
}

// 指定された名称が不適か確認（trueの時は不適）
function isErrorName(c: WorldContainerSetting) {
  return c.name === inputName.value && inputName.value !== prop.containerSettings?.name
}

// 指定されたパスが不適か確認（trueの時は不適）
function isErrorPath(c: WorldContainerSetting) {
  return c.container === pickPath.value && pickPath.value !== prop.containerSettings?.container
}

/**
 * 指定された設定でContainerが不適か確認（trueの時は登録できない）
 */
function isErrorContainer(c: WorldContainerSetting) {
  return isErrorName(c) || isErrorPath(c)
}
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <BaseDialogCard
      :title="containerSettings === void 0
        ? $t('others.worldFolder.addFolder')
        : $t('others.worldFolder.updateFolder')"
      @close="onDialogCancel"
    >
    <template #additionalBtns>
      <ss-btn
        color="primary"
        :disable="
          sysStore.systemSettings.container.filter(isErrorContainer).length > 0
            || inputName === ''
            || pickPath === ''"
        @click="onDialogOK({ name: inputName, container: pickPath } as AddFolderDialogReturns)"
        class="row items-center"
      >
        <span
          v-if="inputName !== ''"
          class="col row"
          v-html="$t('others.worldFolder.addBtn', { name: inputName })"
        />
        <span v-else>{{ $t('others.worldFolder.add') }}</span>
      </ss-btn>
    </template>

      <div class="row q-gutter-md">
        <SsInput v-model="inputName" :label="$t('others.worldFolder.folderName')" autofocus class="col" />
        <SsBtn free-width :label="$t('others.worldFolder.selectFolderBtn')" @click="pickFolder" />
      </div>

      <div v-if="sysStore.systemSettings.container.filter(isErrorName).length > 0"
        class="text-caption text-omit text-negative q-pt-sm">
        {{ $t('others.worldFolder.exist', { name: inputName }) }}
      </div>
      <div v-if="sysStore.systemSettings.container.filter(isErrorPath).length > 0"
        class="text-caption text-omit text-negative q-pt-sm">
        {{ $t('others.worldFolder.registered', omitPath({ 'path': pickPath })) }}
      </div>
      <div v-if="inputName === ''" class="text-caption text-omit text-negative q-pt-sm">
        {{ $t('others.worldFolder.inputFolderName') }}
      </div>
      <div v-if="pickPath === ''" class="text-caption text-omit text-negative q-pt-sm">
        {{ $t('others.worldFolder.selectFolder') }}
      </div>
      <div v-if="pickPath !== ''" class="text-caption text-omit q-pt-sm" style="opacity: .6;">
        {{ pickPath }}
        <SsTooltip :name="pickPath" anchor="bottom start" self="center start" />
      </div>
    </BaseDialogCard>
  </q-dialog>
</template>