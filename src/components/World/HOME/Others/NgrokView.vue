<script setup lang="ts">
import { useQuasar } from 'quasar';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';
import { useSystemStore } from 'src/stores/SystemStore';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import NgrokSettingDialog from './Ngrok/NgrokSettingDialog.vue';
import { NgrokDialogProp, NgrokDialogReturns } from './Ngrok/steps/iNgrok';

const $q = useQuasar();
const sysStore = useSystemStore();
const mainStore = useMainStore();
const consoleStore = useConsoleStore();

const isUseNgrok = () => (sysStore.systemSettings.user.ngrokToken ?? '') !== '';

function onClick() {
  $q.dialog({
    component: NgrokSettingDialog,
    componentProps: {
      token: sysStore.systemSettings.user.ngrokToken ?? '',
    } as NgrokDialogProp,
  }).onOk((p: NgrokDialogReturns) => {
    sysStore.systemSettings.user.ngrokToken = p.token;
    if (p.isAllUesNgrok) {
      mainStore.allWorlds.update((w) => (w.ngrok_setting.use_ngrok = true));
    }
  });
}
</script>

<template>
  <p class="text-caption">
    <span style="white-space: pre-line; opacity: 0.6">
      {{ $t('home.ngrok.desc') }}
    </span>
    <br v-if="!consoleStore.isAllWorldStop()" />
    <span v-if="!consoleStore.isAllWorldStop()" class="text-negative">
      {{
        $t(
          isUseNgrok()
            ? 'home.ngrok.descWarningRegisted'
            : 'home.ngrok.descWarningNoRegist'
        )
      }}
    </span>
  </p>

  <div class="row q-gutter-md">
    <SsBtn
      :label="$t(isUseNgrok() ? 'home.ngrok.btnRegisted' : 'home.ngrok.btn')"
      :disable="!consoleStore.isAllWorldStop()"
      @click="onClick"
    />

    <q-toggle
      v-if="isUseNgrok()"
      v-model="mainStore.world?.ngrok_setting.use_ngrok"
      :label="
        $t(
          mainStore.world?.ngrok_setting.use_ngrok
            ? 'home.ngrok.toggleON'
            : 'home.ngrok.toggleOFF'
        )
      "
      :disable="consoleStore.status(mainStore.selectedWorldID) !== 'Stop'"
    />

    <!-- デバッグ用ボタン -->
    <!-- <q-btn
      color="purple"
      label="トークンリセット"
      @click="() => sysStore.systemSettings.user.ngrokToken = ''"
    /> -->
  </div>
</template>
