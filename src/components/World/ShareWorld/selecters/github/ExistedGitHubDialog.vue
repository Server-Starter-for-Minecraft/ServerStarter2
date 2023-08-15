<script setup lang="ts">
import { ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { RemoteWorldName } from 'app/src-electron/schema/brands';
import { isValid } from 'src/scripts/error';
import { GithubCheckDialogProp, setRemoteWorld } from '../iRemoteSelecter';
import BaseDialogCard from 'src/components/util/baseDialog/baseDialogCard.vue';

defineEmits({...useDialogPluginComponent.emitsObject})
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const prop = defineProps<GithubCheckDialogProp>()

const loading = ref(false)

/**
 * リモートを登録
 */
async function setRemote() {
  loading.value = true
  const res = await setRemoteWorld({
    name: prop.rWorldName as RemoteWorldName,
    folder: {
      type: 'github',
      owner: prop.remoteData.owner,
      repo: prop.remoteData.repo
    }
  }, true)

  if (isValid(res)) {
    onDialogOK()
  }
}
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" :persistent="loading">
    <BaseDialogCard
      :title="`${remoteData.owner}/${remoteData.repo}/${rWorldName}と同期`"
      :ok-btn-txt="`${rWorldName}と同期`"
      :loading="loading"
      @ok-click="setRemote"
      @close="onDialogCancel"
    >
      <p>
        {{ `${rWorldName}を${remoteData.owner}/${remoteData.repo}と同期します` }}<br>
        このワールドのデータは選択したShareWorldのデータによって上書きされます<br>
        {{ `${remoteData.repo}と同期しますか？` }}
      </p>
    </BaseDialogCard>
  </q-dialog>
</template>