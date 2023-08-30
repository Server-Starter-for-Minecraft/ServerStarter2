<script setup lang="ts">
import { Ref, ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { useSystemStore } from 'src/stores/SystemStore';
import { checkError } from 'src/components/Error/Error';
import { tError } from 'src/i18n/utils/tFunc';
import SsSelect from 'src/components/util/base/ssSelect.vue';
import SsInput from 'src/components/util/base/ssInput.vue';
import BaseDialogCard from 'src/components/util/baseDialog/baseDialogCard.vue';

defineEmits({ ...useDialogPluginComponent.emitsObject })
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()

const sysStore = useSystemStore()
const accountType: Ref<'github'> = ref('github')
const ownerName = ref('')
const repoName = ref('')
const pat = ref('')
const loading = ref(false)

/**
 * 登録処理
 */
async function okClick() {
  // 処理中
  loading.value = true

  if (accountType.value === 'github') {
    const folder = {
      type: 'github' as const,
      owner: ownerName.value,
      repo: repoName.value,
    }

    // check settings
    const res = await window.API.invokeValidateRemoteSetting({
      folder: folder,
      pat: pat.value
    })

    checkError(
      res,
      remoteSettings => {
        sysStore.systemSettings.remote.push(remoteSettings)
        onDialogOK()
      },
      e => tError(e)
    )
  }

  // 処理状態を解除
  loading.value = false
}
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" :persistent="loading">
    <BaseDialogCard
      :disable="[ownerName, repoName, pat].includes('')"
      :title="$t('shareWorld.registerNewRemote')"
      :loading="loading"
      :ok-btn-txt="$t('shareWorld.register')"
      @ok-click="okClick"
      @close="onDialogCancel"
    >
      <div class="q-pb-sm">
        <div class="caption" style="opacity: .6;">{{ $t('shareWorld.addRemote.account') }}</div>
        <SsSelect dense v-model="accountType" :options="[{ label: $t('shareWorld.github'), value: 'github' }]" option-label="label"
          option-value="value" />
      </div>
      <div class="q-py-sm">
        <div class="caption" style="opacity: .6;">{{ $t('shareWorld.addRemote.user') }}</div>
        <SsInput dense v-model="ownerName" :rules="[val => val !== '' || $t('shareWorld.addRemote.inputValue')]" />
      </div>
      <div v-show="accountType === 'github'">
        <div class="q-py-sm">
          <div class="caption" style="opacity: .6;">{{ $t('shareWorld.addRemote.repository') }}</div>
          <SsInput dense v-model="repoName" :rules="[val => val !== '' || $t('shareWorld.addRemote.inputValue')]" />
        </div>
        <div class="q-py-sm">
          <div class="caption" style="opacity: .6;">Personal Access Token</div>
          <SsInput dense secret v-model="pat" :rules="[val => val !== '' || $t('shareWorld.addRemote.inputValue')]" />
        </div>
      </div>
    </BaseDialogCard>
  </q-dialog>
</template>