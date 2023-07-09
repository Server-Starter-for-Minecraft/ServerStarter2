<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar'
import { iErrorDialogProps } from './Error'
import { ref } from 'vue';

const prop = defineProps<iErrorDialogProps>()
defineEmits({...useDialogPluginComponent.emitsObject})
const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()

const animationSpeed  = 200
const timeCounter = ref(0)
closeCounter()

function closeCounter() {
  timeCounter.value += 0.01
  if (timeCounter.value < 1 + animationSpeed / 10000) {
    setTimeout(closeCounter, 100)
  }
  else {
    onDialogCancel()
  }
}
</script>

<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
    seamless
    position="bottom"
    transition-show="slide-left"
    transition-hide="slide-right"
  >
    <q-card class="dialogCard fixed-bottom-right q-my-md">
      <q-linear-progress
        :value="timeCounter"
        :animation-speed="animationSpeed"
        color="primary"
      />

      <q-card-section horizontal>
        <q-card-section class="row items-center no-wrap">
          <!-- TODO: check.arg, check.keyによってエラー文をi18nに登録する -->
          <!-- TODO: 最終的にはKeyに付随する説明文をTitleにすることでTitle引数を削除する？（Keyの存在しないエラーが起きた場合は？） -->
          <div>
            <div class="text-weight-bold">{{ title ?? key }}</div>
            <div class="text-grey">{{ arg }}</div>
          </div>
        </q-card-section>

        <q-space />
        <q-separator vertical inset />

        <q-card-actions>
          <q-btn dense round icon="close" size=".8rem" @click="onDialogCancel" />
        </q-card-actions>
      </q-card-section>
    </q-card> 
  </q-dialog>
</template>

<style scoped lang="scss">
.dialogCard {
  min-width: 300px;
  max-width: 50vw;
}
</style>