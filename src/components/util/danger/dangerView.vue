<script setup lang="ts">
import { useQuasar } from 'quasar';
import { dangerDialogProp } from './iDangerDialog';
import SsBtn from '../base/ssBtn.vue';
import DangerDialog from './DangerDialog.vue';

interface Prop {
  disable?: boolean
  viewTitle: string
  viewDesc: string
  dialogTitle: string
  dialogDesc: string
  openDialogBtnText: string
  onAction: () => void
}
const prop = defineProps<Prop>()
const $q = useQuasar()

function openDialog() {
  $q.dialog({
    component: DangerDialog,
    componentProps: {
      dialogTitle: prop.dialogTitle,
      dialogDesc: prop.dialogDesc,
      okBtnTxt: prop.openDialogBtnText
    } as dangerDialogProp
  }).onOk(() => {
    prop.onAction()
  })
}
</script>

<template>
  <div class="q-pt-lg">
    <h1 class="q-pt-sm text-negative">{{ viewTitle }}</h1>
    <p v-html="viewDesc" class="text-caption q-pb-sm" />
    <SsBtn
      :label="openDialogBtnText"
      :disable="disable"
      color="negative"
      @click="openDialog"
    />
  </div>
</template>

<style scoped lang="scss">
p {
  margin: 0;
  margin-bottom: 5px;
}
</style>
