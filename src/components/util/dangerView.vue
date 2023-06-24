<script setup lang="ts">
import { useDialogStore } from 'src/stores/DialogStore'

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
  <div class="q-py-xl">
    <q-card flat bordered class="full-width bg-transparent dangerCard">
      <q-card-section horizontal>
        <div class="col q-pa-md">
          <h1>{{ title }}</h1>
          <p v-html="$t(i18nKey)"/>
        </div>
  
        <q-card-actions vertical class="justify-around">
          <q-btn color="red" :label="btnText" size="1rem" @click="dialog" class="q-mr-sm"/>
        </q-card-actions>
      </q-card-section>
    </q-card>
  </div>
</template>

<style scoped lang="scss">
.dangerCard {
  border-radius: 10px;
  border-color: red;
}

h1 {
  font-size: 1.3rem;
  font-weight: bold;
  padding: 0;
  padding-bottom: 10px;
}

p {
  margin: 0;
  margin-bottom: 5px;
  line-height: 2rem;
}
</style>