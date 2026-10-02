<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import SsA from '../util/base/ssA.vue';
import SsBtn from '../util/base/ssBtn.vue';
import SsI18nT from '../util/base/ssI18nT.vue';
import BaseDialogCard from '../util/baseDialog/baseDialogCard.vue';
import { EulaDialogProp } from './iEulaDialog';

defineProps<EulaDialogProp>();
defineEmits({ ...useDialogPluginComponent.emitsObject });
// 同意・不同意のいずれもOKの値（同意したか）として返し、
// 回答せずにダイアログが閉じられた場合（キャンセル）と区別する
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
</script>

<template>
  <!-- ワールドを切り替えられるよう、画面の操作を妨げない（seamless）ダイアログとして表示する -->
  <q-dialog ref="dialogRef" @hide="onDialogHide" seamless>
    <BaseDialogCard
      :title="$t('eulaDialog.title')"
      :okBtnTxt="$t('eulaDialog.agree')"
      @okClick="onDialogOK(true)"
    >
      <template #default>
        <p
          class="q-my-none"
          style="font-size: 0.8rem; opacity: 0.8; white-space: pre-line"
        >
          <SsI18nT keypath="eulaDialog.desc" tag="label">
            <SsA :url="eulaURL">{{ $t('eulaDialog.eula') }}</SsA>
          </SsI18nT>
        </p>
      </template>
      <template #additionalBtns>
        <SsBtn
          :label="$t('eulaDialog.disagree')"
          color="negative"
          @click="onDialogOK(false)"
        />
      </template>
    </BaseDialogCard>
  </q-dialog>
</template>
