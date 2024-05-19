<script setup lang="ts">
import { ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { sleep } from 'src/scripts/sleep';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import { shutdownSelecter } from './AutoShutdown';

defineEmits({ ...useDialogPluginComponent.emitsObject });
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

// シャットダウンまでの秒数
const autoShutdownCounter = ref(30);
const endCount = 0;
const tick = 200;
let executeShutdown = true;

const closeCounter = async () => {
  while (autoShutdownCounter.value > endCount) {
    await sleep(tick);
    autoShutdownCounter.value -= tick / 1000;
  }
};

// カウンターが終了したらダイアログを閉じる
closeCounter().then(() => {
  onDialogOK();
  shutdownSelecter(executeShutdown);
});

/**
 * ダイアログ付属の閉じるボタンが押された場合の処理
 *
 * counterを0にしてcloseCounterがダイアログを閉じる
 */
function closeClicked() {
  autoShutdownCounter.value = endCount;
  executeShutdown = false;
}
</script>

<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card>
      <q-card-section>
        <div style="font-size: 1.5rem">{{ $t('autoshutdown.title') }}</div>
      </q-card-section>
      <q-card-section>
        <div style="font-size: 1rem; opacity: 0.6; white-space: pre-line">
          {{
            $t('autoshutdown.desc', { time: Math.round(autoShutdownCounter) })
          }}
        </div>
      </q-card-section>
      <q-card-actions align="right">
        <SsBtn :label="$t('general.cancel')" @click="closeClicked" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
