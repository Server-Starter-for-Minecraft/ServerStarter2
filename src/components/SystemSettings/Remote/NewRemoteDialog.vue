<script setup lang="ts">
import { Ref, ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { Remote } from 'app/src-electron/schema/remote';
import { useSystemStore } from 'src/stores/SystemStore';
import SsSelect from 'src/components/util/base/ssSelect.vue';
import SsInput from 'src/components/util/base/ssInput.vue';
import BaseDialogCard from 'src/components/util/baseDialog/baseDialogCard.vue';

defineEmits({...useDialogPluginComponent.emitsObject})
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()

const sysStore = useSystemStore()
const accountType: Ref<Remote['type']> = ref('github')
const ownerName = ref('')
const repoName = ref('')
const pat = ref('')

/**
 * 入力状態を見て登録処理を実行可能か判断する
 */
function checkRegister() {
  if (accountType.value === 'github') {
    return [ownerName.value, repoName.value, pat.value].includes('')
  }
}

/**
 * 登録処理
 */
function okClick() {
  if (accountType.value === 'github') {
    sysStore.remoteSettings().github[`${ownerName.value}/${repoName.value}`] = {
      owner: ownerName.value,
      repo: repoName.value,
      pat: pat.value
    }
  }
  // Dialogを閉じる
  onDialogOK()
}
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <BaseDialogCard
      :disable="[ownerName, repoName, pat].includes('')"
      title="新規ShareWorldの登録"
      ok-btn-txt="登録"
      @ok-click="okClick"
      @close="onDialogCancel"
    >
      <div class="q-pb-sm">
        <div class="caption" style="opacity: .6;">アカウントの種類</div>
        <SsSelect
          dense
          v-model="accountType"
          :options="[{ label: 'GitHub', value: 'github' }]"
          option-label="label"
          option-value="value"
        />
      </div>
      <div class="q-py-sm">
        <div class="caption" style="opacity: .6;">ユーザー名</div>
        <SsInput
          dense
          v-model="ownerName"
          :rules="[val => val !== '' || '値を入力してください']"
        />
      </div>
      <div v-show="accountType === 'github'">
        <div class="q-py-sm">
          <div class="caption" style="opacity: .6;">リポジトリ名</div>
          <SsInput
            dense
            v-model="repoName"
            :rules="[val => val !== '' || '値を入力してください']"
          />
        </div>
        <div class="q-py-sm">
          <div class="caption" style="opacity: .6;">Personal Access Token</div>
          <SsInput
            dense
            secret
            v-model="pat"
            :rules="[val => val !== '' || '値を入力してください']"
          />
        </div>
      </div>
    </BaseDialogCard>
  </q-dialog>
</template>