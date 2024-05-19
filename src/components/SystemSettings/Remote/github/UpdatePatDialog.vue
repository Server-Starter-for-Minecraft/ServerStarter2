<script setup lang="ts">
import { ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import SsInput from 'src/components/util/base/ssInput.vue';
import BaseDialogCard from 'src/components/util/baseDialog/baseDialogCard.vue';
import { updatePatDialogReturns, updatePatProp } from './iGitHubDialog';

const prop = defineProps<updatePatProp>();
defineEmits({ ...useDialogPluginComponent.emitsObject });
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const inputPat = ref(prop.oldPat);
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <BaseDialogCard
      :disable="inputPat === ''"
      :title="$t('shareWorld.githubCard.updatePAT')"
      :overline="$t('shareWorld.github')"
      :ok-btn-txt="$t('shareWorld.githubCard.update')"
      @ok-click="onDialogOK({ newPat: inputPat } as updatePatDialogReturns)"
      @close="onDialogCancel"
    >
      <SsInput
        dense
        secret
        autofocus
        v-model="inputPat"
        :placeholder="$t('shareWorld.githubCard.inputPAT')"
        v-on:keydown.enter="
          onDialogOK({ newPat: inputPat } as updatePatDialogReturns)
        "
      />
    </BaseDialogCard>
  </q-dialog>
</template>
