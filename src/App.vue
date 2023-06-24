<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { setRouter } from './components/Error/Error';
import { useConsoleStore } from './stores/ConsoleStore';
import { useI18n } from 'vue-i18n';
import PopupDialog from './components/util/popupDialog.vue';

// routerを定義
const router = useRouter()
setRouter(router)

// ダークモードを有効にする
const $q = useQuasar();
$q.dark.set('auto');

const consoleStore = useConsoleStore()
// サーバー起動時に画面遷移
window.API.onStartServer((_event, worldID) => {
  consoleStore.setConsole(worldID, '')
})
// サーバー終了時に画面遷移
window.API.onFinishServer((_event, worldID) => {
  consoleStore.setProgress(worldID, '')
})
// System設定変更時に設定を反映
window.API.onUpdateSystemSettings((_event, settings) => {
  console.log(settings.user.language)
  useI18n().locale.value = settings.user.language
})

// Windowの起動時処理
router.push('/init')
</script>

<template>
  <popup-dialog />
  <router-view />
</template>