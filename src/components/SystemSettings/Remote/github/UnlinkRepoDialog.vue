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
      :ok-btn-txt="$t('shareWorld.githubCard.unresister.decide')"
      @ok-click="onDialogOK"
      @close="onDialogCancel"
    >
      <p class="q-my-none" style="font-size: .8rem; opacity: .8;" v-html="$t('shareWorld.githubCard.unresister.desc',{owner: owner,repo: repo})"></p>
    </baseDialogCard>
  </q-dialog>
</template>