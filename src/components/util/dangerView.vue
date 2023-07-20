<script setup lang="ts">
import { useDialogStore } from 'src/stores/DialogStore'
import SsBtn from './base/ssBtn.vue';

interface Prop {
  title: string
  i18nKey: string
  btnText: string
  showDialog?: boolean
  dialogTitleKey?: string
  dialogI18nKey?: string
  dialogI18nArg?: { [key: string]: string }
  onAction: () => void
}
const prop = defineProps<Prop>()

function dialog() {
  if (prop.showDialog && prop.dialogTitleKey && prop.dialogI18nKey) {
    useDialogStore().showDialog(
      prop.dialogTitleKey,
      prop.dialogI18nKey,
      prop.dialogI18nArg,
      [
        {
          label: 'Cancel',
        },
        {
          label: 'OK',
          color: 'primary',
          action: prop.onAction
        }
      ]
    )
  }
  else {
    prop.onAction()
  }
}
</script>

<template>
  <div class="q-py-lg">
    <h1 class="q-pt-sm text-red">{{ title }}</h1>
    <p v-html="$t(i18nKey)" class="text-caption"/>
    <SsBtn
      :label="btnText"
      color="red"
      @click="dialog"
    />
  </div>
</template>

<style scoped lang="scss">
.dangerCard {
  border-radius: 10px;
  border-color: red;
}

p {
  margin: 0;
  margin-bottom: 5px;
  line-height: 2rem;
}
</style>