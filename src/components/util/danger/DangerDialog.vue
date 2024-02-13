<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { dangerDialogProp } from './iDangerDialog';
import BaseDialogCard from '../baseDialog/baseDialogCard.vue';
import SsBtn from '../base/ssBtn.vue';

defineProps<dangerDialogProp>();
defineEmits({ ...useDialogPluginComponent.emitsObject });
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" persistent>
    <BaseDialogCard
      :overline="dialogOverline"
      :title="dialogTitle"
      color="negative"
      :ok-btn-txt="okBtnTxt"
      @ok-click="onDialogOK"
    >
      <template #additionalBtns>
        <SsBtn :label="$t('general.cancel')" @click="onDialogCancel" />
      </template>
      <div
        v-html="dialogDesc"
        class="q-my-none flex"
        style="font-size: 0.8rem; opacity: 0.8"
      />
    </BaseDialogCard>
  </q-dialog>
</template>
