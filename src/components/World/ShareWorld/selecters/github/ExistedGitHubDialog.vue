<script setup lang="ts">
import { ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { RemoteWorldName } from 'app/src-electron/schema/brands';
import { isValid } from 'src/scripts/error';
import { GithubCheckDialogProp, setRemoteWorld } from '../iRemoteSelecter';
import BaseDialogCard from 'src/components/util/baseDialog/baseDialogCard.vue';
import WorldItem from 'src/components/util/WorldItem.vue';

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
      :title="$t('shareWorld.sync',{ path:`${remoteData.owner}/${remoteData.repo}/${rWorldName}` })"
      :ok-btn-txt="$t('shareWorld.sync',{ path:`${rWorldName}` })"
      :loading="loading"
      @ok-click="setRemote"
      @close="onDialogCancel"
    >
      <p 
        style="font-size: 
        .8rem; opacity: .8;"
        v-html="$t('shareWorld.existedDialog',{rWorldName: rWorldName})"
      >
      </p>
      
      <WorldItem
        :icon="rIcon"
        :world-name="rWorldName"
        :version-name="rVersionName"
        :last-played="rLastPlayed"
        style="min-width: 20rem; max-width: 20rem;;"
      />
    </BaseDialogCard>
  </q-dialog>
</template>