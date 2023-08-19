<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import BaseDialogCard from 'src/components/util/baseDialog/baseDialogCard.vue';

defineEmits({...useDialogPluginComponent.emitsObject})
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()

// recover api はOnDilaogOKする前にここで実行する
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <BaseDialogCard
      title="バックアップから復旧"
      @close="onDialogCancel"
    >
    </BaseDialogCard>
  </q-dialog>
</template>