<script setup lang="ts">
import { ref, toRaw } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { RemoteWorldName } from 'app/src-electron/schema/brands';
import { isError, isValid } from 'src/scripts/error';
import { GithubCheckDialogProp, setRemoteWorld } from '../iRemoteSelecter';
import BaseDialogCard from 'src/components/util/baseDialog/baseDialogCard.vue';
import SsInput from 'src/components/util/base/ssInput.vue';

defineEmits({...useDialogPluginComponent.emitsObject})
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const prop = defineProps<GithubCheckDialogProp>()

const loading = ref(false)
const isValidName = ref(false)
const inputName = ref(prop.rWorldName)

/**
 * ワールド名のバリデーションを行う
 */
async function validateWorldName(name: string) {
  const res = await window.API.invokeValidateNewRemoteWorldName(toRaw(prop.remoteData), name)
  if (isError(res)) {
    isValidName.value = false
    return 'ShareWorldの新規名称として使用できません'
  }
  else {
    isValidName.value = true
    return true
  }
}

/**
 * リモートを登録
 */
async function setRemote() {
  loading.value = true
  const res = await setRemoteWorld({
    name: inputName.value as RemoteWorldName,
    folder: {
      type: 'github',
      owner: prop.remoteData.owner,
      repo: prop.remoteData.repo
    }
  }, false)

  if (isValid(res)) {
    onDialogOK()
  }
}
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" :persistent="loading">
    <BaseDialogCard
      title="新規ShareWorldと同期"
      ok-btn-txt="新規データで同期"
      :loading="loading"
      :disable="!isValidName"
      @ok-click="setRemote"
      @close="onDialogCancel"
    >
      <p>
        新規ShareWorldを作成して同期データを作成します<br>
        同期する際に用いるShareWorldの名称を入力してください
      </p>

      <SsInput
        v-model="inputName"
        label="新規ShareWorldの名称を入力"
        :debounce="200"
        :rules="[val => validateWorldName(val)]"
        @clear="isValidName = false"
      />
    </BaseDialogCard>
  </q-dialog>
</template>