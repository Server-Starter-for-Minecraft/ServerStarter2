<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { unlinkRepoProp } from './iGitHubDialog';
import BaseDialogCard from 'src/components/util/baseDialog/baseDialogCard.vue';

defineProps<unlinkRepoProp>()
defineEmits({...useDialogPluginComponent.emitsObject})
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <BaseDialogCard
      :title="title"
      color="red"
      overline="GitHub"
      ok-btn-txt="登録を解除"
      @ok-click="onDialogOK"
      @close="onDialogCancel"
    >
      <p class="q-my-none" style="font-size: .8rem; opacity: .8;">
        ServerStarter2 から 「{{ owner }} / {{ repo }}」の登録を解除します。<br>
        GitHub上のリポジトリは削除されませんが、「{{ owner }} / {{ repo }}」を用いてワールドを再共有することはできません。
      </p>
    </baseDialogCard>
  </q-dialog>
</template>