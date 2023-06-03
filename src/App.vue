<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { setRouter } from './components/Error/Error';
import { useConsoleStore } from './stores/ConsoleStore';
import PopupDialog from './components/util/popupDialog.vue';

// routerを定義
const router = useRouter()
setRouter(router)

// ダークモードを有効にする
const $q = useQuasar();
$q.dark.set('auto');

// メッセージをコンソールに追加
window.API.onAddConsole((_event, value) => {
  useConsoleStore().console.push(value);
});

// Windowの起動時処理
router.push('/init')
</script>

<template>
  <popup-dialog/>
  <router-view />
</template>