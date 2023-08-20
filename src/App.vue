<script setup lang="ts">
import { toRaw, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { setCssVar, useQuasar } from 'quasar';
import { setI18nFunc } from './i18n/utils/tFunc';
import { useConsoleStore } from './stores/ConsoleStore';
import { initSystemSettings, useSystemStore, setSysSettingsSubscriber } from './stores/SystemStore';
import { useMainStore, useWorldStore } from 'src/stores/MainStore';
import { useProgressStore } from 'src/stores/ProgressStore';
import { setPlayerSearchSubscriber, usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import { checkError, setOpenDialogFunc } from 'src/components/Error/Error';
import { setShutdownHandler } from './components/SystemSettings/General/AutoShutdown/AutoShutdown';
import { EulaDialogProp } from 'src/components/Progress/iEulaDialog';
import { deepCopy } from './scripts/deepCopy';
import ErrorDialogView from './components/Error/ErrorDialogView.vue'
import EulaDialog from 'src/components/Progress/EulaDialog.vue';

const sysStore = useSystemStore();
const mainStore = useMainStore()
const worldStore = useWorldStore()
const playerStore = usePlayerStore()
const consoleStore = useConsoleStore()
const progressStore = useProgressStore();

// routerを定義
const router = useRouter()
// 言語設定を定義
const $t = useI18n()
const { t } = useI18n()
setI18nFunc(t)

// 仮のテーマを適用する
const $q = useQuasar();
$q.dark.set('auto');

// primaryの色を定義
watch(() => $q.dark.isActive, val => {
  setPrimary(val)
})

// サーバー起動時に画面遷移
window.API.onStartServer((_event, worldID) => {
  consoleStore.setConsole(worldID, '')
})
// サーバー終了時に画面遷移
window.API.onFinishServer((_event, worldID) => {
  consoleStore.initProgress(worldID, 'サーバーをシャットダウン中')
})
// サーバーに送信されたコンソールの処理
window.API.onAddConsole((_event, worldID, chunk) => {
  consoleStore.setConsole(worldID, chunk);
})
// Eulaの同意処理
window.API.handleAgreeEula(async (_: Electron.IpcRendererEvent, worldID, url) => {
  const promise = new Promise<boolean>(
    (resolve) => { progressStore.back2frontHandler(worldID, resolve) }
  );

  $q.dialog({
    component: EulaDialog,
    componentProps: {
      eulaURL: url
    } as EulaDialogProp
  }).onOk(() => {
    progressStore.getProgress(worldID).selecter?.(true)
  }).onCancel(() => {
    progressStore.getProgress(worldID).selecter?.(false)
  })

  return await promise;
});
// Progressがバックエンドからやってきたときの処理
window.API.onProgress((_event, worldID, progress) => {
  progressStore.setProgress(worldID, progress)
});
// エラーが発生した際にDialogを表示
setOpenDialogFunc((args) => {
  $q.dialog({
    component: ErrorDialogView,
    componentProps: args
  })
})

// Windowの起動時処理
firstProcess()
setSubscribe()
setShutdownHandler()


/**
 * ユーザー設定を反映する
 */
async function setUserSettings() {
  // 言語設定
  $t.locale.value = sysStore.systemSettings.user.language

  // ダークモード
  const isAuto = sysStore.systemSettings.user.theme === 'auto'
  const isDark = sysStore.systemSettings.user.theme === 'dark'
  $q.dark.set(isAuto ? 'auto' : isDark)

  // primaryの色を定義
  setPrimary($q.dark.isActive)
}

/**
 * システム設定を読み込んだ後、起動時処理を行う
 */
async function firstProcess() {
  // systemSettingsの読み込み
  initSystemSettings(deepCopy(await window.API.invokeGetSystemSettings()))

  // UserSettingsの読み込み
  await setUserSettings()

  // 起動時処理の開始
  router.replace('/init')
}

/**
 * 変数の変更に合わせて処理を入れるためのSubscriberを定義する
 */
function setSubscribe() {
  // TODO: SetWorldの戻り値を反映する場合にはcurrentSelectedIDを利用して当該ワールドのデータを更新する
  // ただし、単純に更新をかけると、その保存処理が再帰的に発生するため、現在はundefinedとして、処理を行っていない
  const currentSelectedId = mainStore.selectedWorldID

  // TODO: worldStoreのPrivate化
  worldStore.$subscribe((mutation, state) => {
    window.API.invokeSetWorld(toRaw(mainStore.world)).then(v => {
      checkError(
        v.value,
        undefined,
        () => { return { title: 'ワールドの設定を保存できませんでした' } }
      )
    })
  })
  
  setSysSettingsSubscriber()

  setPlayerSearchSubscriber(playerStore)
}

/**
 * primaryの色を定義
 */
function setPrimary(isDark: boolean) {
  if (isDark) {
    setCssVar('primary', '#7FFF00')
  }
  else {
    setCssVar('primary', '#1EB000')
  }
}
</script>

<template>
  <router-view />
</template>