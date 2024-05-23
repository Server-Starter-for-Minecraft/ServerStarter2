<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import BaseDialogCard from 'src/components/util/baseDialog/baseDialogCard.vue';
import { ImgDialogProp } from '../iNgrok';

defineEmits({ ...useDialogPluginComponent.emitsObject });
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
defineProps<ImgDialogProp>();
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <BaseDialogCard
      :title="$t('home.ngrok.dialog.imageDetail')"
      @close="onDialogOK"
      :style="{ width: `${imgWidth}rem` }"
    >
      <q-img :src="img" />
    </BaseDialogCard>
  </q-dialog>
</template>
