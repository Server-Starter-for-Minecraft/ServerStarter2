<script setup lang="ts">
import { useQuasar } from 'quasar';
import { useSystemStore } from 'src/stores/SystemStore';
import { useMainStore } from 'src/stores/MainStore';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { NgrokDialogProp, NgrokDialogReturns } from './Ngrok/steps/iNgrok';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import NgrokSettingDialog from './Ngrok/NgrokSettingDialog.vue';

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
  });
}
</script>

<template>
  <p class="text-caption">
    <span style="opacity: 0.6">
      「ポート開放」と呼ばれる設定をせずに，友人や外部の方をサーバーに招待するための機能です<br />
      ServerStarter2ですべてのマルチプレイの準備を整えましょう
    </span>
    <span v-if="!consoleStore.isAllWorldStop()" class="text-negative"><br/>この設定はすべてのサーバーが停止しているときにのみ設定することができます</span>
  </p>

  <div class="row q-gutter-md">
    <SsBtn
      :label="
        isUseNgrok() ? 'トークンを更新する' : 'ポート開放不要の設定をする'
      "
      :disable="!consoleStore.isAllWorldStop()"
      @click="onClick"
    />

    <q-toggle
      v-if="isUseNgrok()"
      v-model="mainStore.world.ngrok_setting.use_ngrok"
      :label="`不要化設定を利用${
        mainStore.world.ngrok_setting.use_ngrok ? 'する' : 'しない'
      }`"
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
