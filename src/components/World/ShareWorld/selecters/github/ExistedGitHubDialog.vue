<script setup lang="ts">
import { ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { asBrand } from 'app/src-public/scripts/brand';
import { isValid } from 'app/src-public/scripts/error';
import { RemoteWorldName } from 'app/src-electron/schema/brands';
import BaseDialogCard from 'src/components/util/baseDialog/baseDialogCard.vue';
import WorldItem from 'src/components/util/WorldItem.vue';
import { GithubCheckDialogProp, setRemoteWorld } from '../iRemoteSelecter';

defineEmits({ ...useDialogPluginComponent.emitsObject });
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const prop = defineProps<GithubCheckDialogProp>();

const loading = ref(false);

/**
 * リモートを登録
 */
async function setRemote() {
  loading.value = true;
  const res = await setRemoteWorld(
    {
      name: asBrand(RemoteWorldName, prop.rWorldName),
      folder: {
        type: 'github',
        owner: prop.remoteData.owner,
        repo: prop.remoteData.repo,
      },
    },
    true
  );

  // 失敗した場合は setRemoteWorld の中でエラーを表示するため，ダイアログを開いたままにする
  if (res !== undefined && isValid(res.value)) {
    onDialogOK();
  }
}
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" :persistent="loading">
    <BaseDialogCard
      :title="
        $t('shareWorld.sync', {
          path: `${remoteData.owner}/${remoteData.repo}/${rWorldName}`,
        })
      "
      :ok-btn-txt="$t('shareWorld.sync', { path: `${rWorldName}` })"
      :loading="loading"
      :onClose="loading ? undefined : onDialogCancel"
      @ok-click="setRemote"
    >
      <p style="font-size: 0.8rem; opacity: 0.8; white-space: pre-line">
        {{ $t('shareWorld.existedDialog', { rWorldName: rWorldName }) }}
      </p>

      <WorldItem
        :icon="rIcon"
        :world-name="rWorldName"
        :version-name="rVersionName"
        :last-played="rLastPlayed"
        style="min-width: 20rem; max-width: 20rem"
      />
    </BaseDialogCard>
  </q-dialog>
</template>
