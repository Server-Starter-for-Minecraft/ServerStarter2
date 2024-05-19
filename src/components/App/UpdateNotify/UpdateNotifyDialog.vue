<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import BaseDialogCard from 'src/components/util/baseDialog/baseDialogCard.vue';
import { UpdateNotifyProp } from './iUpdateNotifyDialog';

defineEmits({ ...useDialogPluginComponent.emitsObject });
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
defineProps<UpdateNotifyProp>();
</script>

<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <BaseDialogCard
      :title="$t('updater.title')"
      :ok-btn-txt="$t('updater.btn')"
      @ok-click="onDialogOK"
    >
      <div
        class="fit"
        style="font-size: 0.8rem; opacity: 0.6; white-space: pre-line"
      >
        {{ $t('updater.desc', { newVer: newVer }) }}
      </div>
    </BaseDialogCard>
  </q-dialog>
</template>
