<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { shutdownSelecter } from './AutoShutdown';
import SsBtn from 'src/components/util/base/ssBtn.vue';

defineEmits({...useDialogPluginComponent.emitsObject})
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()

// シャットダウンまでの秒数
const autoShutdownInterval = ref(30)

/**
 * シャットダウンまでの秒数をカウントダウンし、
 * 所定の秒数が終了したのちに処理を実行
 */
function shutdownCounter() {
  window.setTimeout(
    () => {
      // 時間経過で値を減ずる
      autoShutdownInterval.value -= 1

      // 経過時間に応じて処理を変更
      if (autoShutdownInterval.value > 0) {
        shutdownCounter()
      }
      else {
        shutdownSelecter(true)
        onDialogOK()
      }
    },
    1000
  )
}

// 30秒後に自動でCloseする
// （手動でCloseした場合は実行後にshutdownSelecter内で呼ばれるsendResがUndefinedになるため、
// 30秒後にshutdownSelecterが呼ばれても何も起きない）
onMounted(shutdownCounter)
</script>

<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card>
      <q-card-section>
        <div style="font-size: 1.5rem;">自動シャットダウン</div>
      </q-card-section>
      <q-card-section>
        <div style="font-size: 1rem; opacity: .6;">
          {{ `${autoShutdownInterval}秒後にこのPCをシャットダウンします。` }}<br>
          キャンセルの場合は、シャットダウンしません。
        </div>
      </q-card-section>
      <q-card-actions align="right">
        <SsBtn label="キャンセル" @click="shutdownSelecter(false)" v-close-popup />
        <SsBtn :label="`OK（${autoShutdownInterval}秒後にシャットダウン）`" @click="onDialogOK" class="text-primary" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>