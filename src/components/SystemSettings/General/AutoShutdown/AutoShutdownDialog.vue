<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { shutdownSelecter } from './AutoShutdown';
import SsBtn from 'src/components/util/base/ssBtn.vue';

defineEmits({ ...useDialogPluginComponent.emitsObject });
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

// シャットダウンまでの秒数
const autoShutdownInterval = ref(30);

/**
 * シャットダウンまでの秒数をカウントダウンし、
 * 所定の秒数が終了したのちに処理を実行
 */
function shutdownCounter() {
  window.setTimeout(() => {
    // 時間経過で値を減ずる
    autoShutdownInterval.value -= 1;

    // 経過時間に応じて処理を変更
    if (autoShutdownInterval.value > 0) {
      shutdownCounter();
    } else {
      shutdownSelecter(true);
      onDialogOK();
    }
  }, 1000);
}

// 30秒後に自動でCloseする
// （手動でCloseした場合は実行後にshutdownSelecter内で呼ばれるsendResがUndefinedになるため、
// 30秒後にshutdownSelecterが呼ばれても何も起きない）
onMounted(shutdownCounter);
</script>

<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card>
      <q-card-section>
        <div style="font-size: 1.5rem">{{ $t('autoshutdown.title') }}</div>
      </q-card-section>
      <q-card-section>
        <div style="font-size: 1rem; opacity: 0.6; white-space: pre-line">
          {{ $t('autoshutdown.desc', { time: autoShutdownInterval }) }}
        </div>
      </q-card-section>
      <q-card-actions align="right">
        <SsBtn
          :label="$t('general.cancel')"
          @click="shutdownSelecter(false)"
          v-close-popup
        />
        <SsBtn
          :label="$t('autoshutdown.ok', { time: autoShutdownInterval })"
          @click="onDialogOK"
          class="text-primary"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
