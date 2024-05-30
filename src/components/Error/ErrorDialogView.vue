<script setup lang="ts">
import { ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { sleep } from 'app/src-public/scripts/sleep';
import { iErrorDialogProps } from './Error';

defineProps<iErrorDialogProps>();
defineEmits({ ...useDialogPluginComponent.emitsObject });
const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent();

const hovered = ref(false);
const animationSpeed = 100;
const timeCounter = ref(1);
const endCount = 0;

const closeCounter = async () => {
  while (timeCounter.value > endCount) {
    await sleep(50);
    // ホバー中はカウントを進めない
    if (!hovered.value) {
      timeCounter.value -= animationSpeed / 10000;
    }
  }
};
// カウンターが終了したらダイアログを閉じる
closeCounter().then(onDialogCancel);

/**
 * ダイアログ付属の閉じるボタンが押された場合の処理
 *
 * counterを0にしてcloseCounterがダイアログを閉じる
 */
function closeClicked() {
  timeCounter.value = endCount;
}
</script>

<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
    @mouseover="hovered = true"
    @mouseleave="hovered = false"
    seamless
    position="bottom"
    transition-show="slide-left"
    transition-hide="slide-right"
  >
    <q-card class="dialogCard fixed-bottom-right q-my-md">
      <q-card-section horizontal>
        <q-card-section class="row items-center no-wrap">
          <div>
            <div class="text-weight-bold">{{ title }}</div>
            <div v-if="desc && desc !== 'undefined'" class="text-grey">
              {{ desc }}
            </div>
          </div>
        </q-card-section>

        <q-space />
        <q-separator vertical inset />

        <q-card-actions>
          <q-btn
            dense
            round
            flat
            icon="close"
            size=".8rem"
            @click="closeClicked"
          />
        </q-card-actions>
      </q-card-section>

      <q-linear-progress
        :value="timeCounter"
        :animation-speed="animationSpeed"
        color="primary"
      />
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
.dialogCard {
  min-width: 300px;
  max-width: 50vw;
}
</style>
