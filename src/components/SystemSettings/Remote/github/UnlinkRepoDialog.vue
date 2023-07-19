<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { unlinkRepoProp } from '../baseDialog/iBaseDialog';
import baseDialogCard from '../baseDialog/baseDialogCard.vue'

defineProps<unlinkRepoProp>()
defineEmits({...useDialogPluginComponent.emitsObject})
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <baseDialogCard
      :title="title"
      :color="color"
      :overline="overline"
      :ok-btn-txt="okBtnTxt"
      @ok-click="onDialogOK"
      @close="onDialogCancel"
    >
      <p style="font-size: .8rem; opacity: .8;">
        ServerStarter2 から 「{{ owner }} / {{ repo }}」の登録を解除します。<br>
        GitHub上のリポジトリは削除されませんが、「{{ owner }} / {{ repo }}」を用いてワールドを再共有することはできません。
      </p>
    </baseDialogCard>
  </q-dialog>
</template>