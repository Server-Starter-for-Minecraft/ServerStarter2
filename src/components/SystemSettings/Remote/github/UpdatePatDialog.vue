<script setup lang="ts">
import { ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { updatePatProp, updatePatDialogReturns } from './iGitHubDialog';
import BaseDialogCard from 'src/components/util/baseDialog/baseDialogCard.vue';
import SsInput from 'src/components/util/base/ssInput.vue';

const prop = defineProps<updatePatProp>()
defineEmits({ ...useDialogPluginComponent.emitsObject })
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()

const inputPat = ref(prop.oldPat)
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <BaseDialogCard
      :disable="inputPat === ''"
      title="Personal Access Tokenを更新"
      overline="GitHub"
      ok-btn-txt="Tokenを更新"
      @ok-click="onDialogOK({ newPat: inputPat } as updatePatDialogReturns)"
      @close="onDialogCancel"
    >
      <SsInput
        dense
        secret
        autofocus
        v-model="inputPat"
        placeholder="Personal Access Token を入力"
      />
    </BaseDialogCard>
  </q-dialog>
</template>