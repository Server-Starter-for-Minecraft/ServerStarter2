<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { setRouter } from './components/Error/Error';
import { useConsoleStore } from './stores/ConsoleStore';
import { useSystemStore } from './stores/SystemStore';
import { deepCopy } from './scripts/deepCopy';
import PopupDialog from './components/util/popupDialog.vue';

const sysStore = useSystemStore();
const consoleStore = useConsoleStore()

// routerを定義
const router = useRouter()
setRouter(router)

// 仮のテーマを適用する
const $q = useQuasar();
$q.dark.set('auto');

// サーバー起動時に画面遷移
window.API.onStartServer((_event, worldID) => {
  consoleStore.setConsole(worldID, '')
})
// サーバー終了時に画面遷移
window.API.onFinishServer((_event, worldID) => {
  consoleStore.setProgress(worldID, '')
})

// System設定変更時に設定を反映
const $t = useI18n()
window.API.onUpdateSystemSettings((_event, settings) => {
  $t.locale.value = settings.user.language
})

// Windowの起動時処理
firstProcess()


// ユーザー設定を反映する
async function setUserSettings() {
  // systemSettingsの読み込み
  sysStore.baseSystemSettings = deepCopy(await window.API.invokeGetSystemSettings())
  
  // 言語設定
  $t.locale.value = sysStore.systemSettings().user.language

  // ダークモード
  const isAuto = sysStore.systemSettings().user.theme === 'auto'
  const isDark = sysStore.systemSettings().user.theme === 'dark'
  $q.dark.set(isAuto ? 'auto' : isDark)
}

async function firstProcess() {
  await setUserSettings()
  router.push('/init')
}
</script>

<template>
  <popup-dialog />
  <router-view />
</template>