<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { EulaDialogProp } from './iEulaDialog';
import BaseDialogCard from '../util/baseDialog/baseDialogCard.vue';
import SsA from '../util/base/ssA.vue';
import SsBtn from '../util/base/ssBtn.vue';

defineProps<EulaDialogProp>();
defineEmits({ ...useDialogPluginComponent.emitsObject });
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" persistent>
    <BaseDialogCard
      :title="$t('eulaDialog.title')"
      :okBtnTxt="$t('eulaDialog.agree')"
      @okClick="onDialogOK"
    >
      <template #default>
        <p class="q-my-none" style="font-size: 0.8rem; opacity: 0.8; white-space: pre-line;">
          <i18n-t keypath="eulaDialog.desc" tag="label">
            <SsA :url="eulaURL">{{ $t('eulaDialog.eula') }}</SsA>
          </i18n-t>
        </p>
      </template>
      <template #additionalBtns>
        <SsBtn
          :label="$t('eulaDialog.disagree')"
          color="negative"
          @click="onDialogCancel"
        />
      </template>
    </BaseDialogCard>
  </q-dialog>
</template>
