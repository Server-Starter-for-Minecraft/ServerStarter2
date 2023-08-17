<script setup lang="ts">
import { Ref, ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { useSystemStore } from 'src/stores/SystemStore';
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

/**
 * 登録処理
 */
function okClick() {
  if (accountType.value === 'github') {
    const folder = {
      type: 'github' as const,
      owner: ownerName.value,
      repo: repoName.value,
    }
    sysStore.systemSettings.remote.push({
      folder: folder,
      pat: pat.value
    })
  }
  // Dialogを閉じる
  onDialogOK()
}
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <BaseDialogCard :disable="[ownerName, repoName, pat].includes('')" :title="$t('shareWorld.registerNewRemote')"
      :ok-btn-txt="$t('shareWorld.register')" @ok-click="okClick" @close="onDialogCancel">
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