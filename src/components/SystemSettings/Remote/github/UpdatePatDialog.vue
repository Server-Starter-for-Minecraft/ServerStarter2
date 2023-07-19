<script setup lang="ts">
import { ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { updatePatProp, updatePatDialogReturns } from '../baseDialog/iBaseDialog';
import baseDialogCard from '../baseDialog/baseDialogCard.vue'
import SsInput from 'src/components/util/base/ssInput.vue';

const prop = defineProps<updatePatProp>()
defineEmits({ ...useDialogPluginComponent.emitsObject })
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()

const inputPat = ref(prop.oldPat)
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <baseDialogCard
      :disable="inputPat === ''"
      :title="title"
      :color="color"
      :overline="overline"
      :ok-btn-txt="okBtnTxt"
      @ok-click="onDialogOK({ newPat: inputPat } as updatePatDialogReturns)"
      @close="onDialogCancel"
    >
      <SsInput
        dense
        v-model="inputPat"
        placeholder="Personal Access Token を入力"
        @clear="inputPat = ''"
      />
    </baseDialogCard>
  </q-dialog>
</template>