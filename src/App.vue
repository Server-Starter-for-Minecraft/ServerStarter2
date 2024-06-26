<script setup lang="ts">
import { toRaw, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { deepcopy } from 'app/src-public/scripts/deepcopy';
import { $T, setI18nFunc, tError } from './i18n/utils/tFunc';
import { useConsoleStore } from './stores/ConsoleStore';
import {
  initSystemSettings,
  setSysSettingsSubscriber,
  useSystemStore,
} from './stores/SystemStore';
import { setWorldSubscriber } from './stores/WorldStore';
import { usePropertyStore } from './stores/WorldTabs/PropertyStore';
import { useMainStore } from 'src/stores/MainStore';
import { useProgressStore } from 'src/stores/ProgressStore';
import {
  setPlayerSearchSubscriber,
  usePlayerStore,
} from 'src/stores/WorldTabs/PlayerStore';
import { setColor } from './color';
import { UpdateNotifyProp } from './components/App/UpdateNotify/iUpdateNotifyDialog';
import { setShutdownHandler } from './components/SystemSettings/General/AutoShutdown/AutoShutdown';
import { checkError, setOpenDialogFunc } from 'src/components/Error/Error';
import { EulaDialogProp } from 'src/components/Progress/iEulaDialog';
import UpdateNotifyDialog from './components/App/UpdateNotify/UpdateNotifyDialog.vue';
import ErrorDialogView from './components/Error/ErrorDialogView.vue';
import EulaDialog from 'src/components/Progress/EulaDialog.vue';

const sysStore = useSystemStore();
const mainStore = useMainStore();
const propertyStore = usePropertyStore();
const playerStore = usePlayerStore();
const consoleStore = useConsoleStore();
const progressStore = useProgressStore();

// routerを定義
const router = useRouter();
// 言語設定を定義
const $t = useI18n();
const { t, te } = useI18n();
setI18nFunc(t, te);

// 仮のテーマを適用する
const $q = useQuasar();
$q.dark.set('auto');

// primaryの色を定義
watch(
  () => $q.dark.isActive,
  (val) => {
    setColor(val, sysStore.systemSettings.user.visionSupport);
  }
);

// サーバー起動時に画面遷移
window.API.onStartServer((_event, worldID, notification) => {
  consoleStore.setConsole(worldID, '', false);
  mainStore.setWorldIP(worldID, notification.ngrokURL);
  propertyStore.setServerPort(worldID, notification.port);
});
// サーバー終了時に画面遷移
window.API.onFinishServer((_event, worldID) => {
  consoleStore.initProgress(worldID, $T('console.shutdownServer'));
});
// サーバーに送信されたコンソールの処理
window.API.onAddConsole((_event, worldID, chunk, isError) => {
  consoleStore.setConsole(worldID, chunk, isError);
});
// アップデートを実行するときに確認のダイアログを表示する
window.API.onNotifySystemUpdate((_event, os, newVer) => {
  $q.dialog({
    component: UpdateNotifyDialog,
    componentProps: {
      os: os,
      newVer: newVer,
    } as UpdateNotifyProp,
  }).onOk(() => {
    window.API.sendOpenBrowser(
      'https://server-starter-for-minecraft.github.io'
    );
  });
});

// Eulaの同意処理
window.API.handleAgreeEula(
  async (_: Electron.IpcRendererEvent, worldID, url) => {
    const promise = new Promise<boolean>((resolve) => {
      progressStore.back2frontHandler(worldID, resolve);
    });

    $q.dialog({
      component: EulaDialog,
      componentProps: {
        eulaURL: url,
      } as EulaDialogProp,
    })
      .onOk(() => {
        progressStore.getProgress(worldID).selecter?.(true);
      })
      .onCancel(() => {
        progressStore.getProgress(worldID).selecter?.(false);
      });

    return await promise;
  }
);
// Progressがバックエンドからやってきたときの処理
window.API.onProgress((_event, worldID, progress) => {
  progressStore.setProgress(worldID, progress);
});
// エラーが発生した際にDialogを表示
setOpenDialogFunc((args) => {
  $q.dialog({
    component: ErrorDialogView,
    componentProps: args,
  });
});

// Windowの起動時処理
firstProcess();
setSubscribe();
setShutdownHandler();

/**
 * ユーザー設定を反映する
 */
async function setUserSettings() {
  // 言語設定
  $t.locale.value = sysStore.systemSettings.user.language;

  // ダークモード
  const isAuto = sysStore.systemSettings.user.theme === 'auto';
  const isDark = sysStore.systemSettings.user.theme === 'dark';
  $q.dark.set(isAuto ? 'auto' : isDark);

  // primaryの色を定義
  setColor($q.dark.isActive, sysStore.systemSettings.user.visionSupport);
}

/**
 * システム設定を読み込んだ後、起動時処理を行う
 */
async function firstProcess() {
  // systemSettingsの読み込み
  initSystemSettings(deepcopy(await window.API.invokeGetSystemSettings()));

  // UserSettingsの読み込み
  await setUserSettings();

  // 起動時処理の開始
  router.replace('/init');
}

/**
 * 変数の変更に合わせて処理を入れるためのSubscriberを定義する
 */
function setSubscribe() {
  setWorldSubscriber();

  setSysSettingsSubscriber();

  setPlayerSearchSubscriber(playerStore);
}

// App.vueでの初期化処理がすべて終わったことを通知
window.API.sendReadyWindow();
</script>

<template>
  <router-view />
</template>
