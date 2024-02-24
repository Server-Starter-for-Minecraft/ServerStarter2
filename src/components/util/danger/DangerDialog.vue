<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { dangerDialogProp } from './iDangerDialog';
import BaseDialogCard from '../baseDialog/baseDialogCard.vue';

defineProps<dangerDialogProp>();
defineEmits({ ...useDialogPluginComponent.emitsObject });
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <BaseDialogCard
      :overline="dialogOverline"
      :title="dialogTitle"
      color="negative"
      :ok-btn-txt="okBtnTxt"
      @ok-click="onDialogOK"
      @close="onDialogCancel"
    >
      <div
        v-html="dialogDesc"
        class="q-my-none flex"
        style="font-size: 0.8rem; opacity: 0.8"
      />
    </BaseDialogCard>
  </q-dialog>
</template>
