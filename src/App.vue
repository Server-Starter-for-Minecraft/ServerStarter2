<script setup lang="ts">
import { toRaw } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useConsoleStore } from './stores/ConsoleStore';
import { useSystemStore } from './stores/SystemStore';
import { useMainStore, useWorldStore } from 'src/stores/MainStore';
import { setPlayerSearchSubscriber, usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import { checkError, setRouter } from 'src/components/Error/Error';
import { deepCopy } from './scripts/deepCopy';
import PopupDialog from './components/util/popupDialog.vue';

const sysStore = useSystemStore();
const mainStore = useMainStore()
const worldStore = useWorldStore()
const playerStore = usePlayerStore()
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
// サーバーに送信されたコンソールの処理
window.API.onAddConsole((_event, worldID, chunk) => {
  consoleStore.setConsole(worldID, chunk);
})

// System設定変更時に設定を反映
const $t = useI18n()
// window.API.onUpdateSystemSettings((_event, settings) => {
//   $t.locale.value = settings.user.language
// })

// Windowの起動時処理
firstProcess()
setSubscribe()


// ユーザー設定を反映する
async function setUserSettings() {
  // 言語設定
  $t.locale.value = sysStore.systemSettings().user.language

  // ダークモード
  const isAuto = sysStore.systemSettings().user.theme === 'auto'
  const isDark = sysStore.systemSettings().user.theme === 'dark'
  $q.dark.set(isAuto ? 'auto' : isDark)
}

async function firstProcess() {
  // systemSettingsの読み込み
  sysStore.baseSystemSettings = deepCopy(await window.API.invokeGetSystemSettings())

  // UserSettingsの読み込み
  await setUserSettings()

  // 起動時処理の開始
  router.push('/init')
}

function setSubscribe() {
  // TODO: SetWorldの戻り値を反映する場合にはcurrentSelectedIDを利用して当該ワールドのデータを更新する
  // ただし、単純に更新をかけると、その保存処理が再帰的に発生するため、現在はundefinedとして、処理を行っていない
  const currentSelectedId = mainStore.selectedWorldID

  worldStore.$subscribe((mutation, state) => {
    if (!mainStore.newWorlds.includes(mainStore.selectedWorldID)) {
      window.API.invokeSetWorld(toRaw(mainStore.world)).then(v => {
        checkError(
          v.value,
          undefined,
          'ワールドの設定を保存できませんでした'
        )
      })
    }
  })

  setPlayerSearchSubscriber(playerStore)
}
</script>

<template>
  <popup-dialog />
  <router-view />
</template>