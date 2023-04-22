<template>
  <router-view />
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { setRouter } from './components/Error/Error';
import { InitWindow } from './init';
import { useConsoleStore } from './stores/ConsoleStore';
import { useQuasar } from 'quasar';

// ダークモードを有効にする
const $q = useQuasar();
$q.dark.set('auto');

// routerを定義
const router = useRouter()
setRouter(router)

// メッセージをコンソールに追加
window.API.onAddConsole((_event, value) => {
  useConsoleStore().console.push(value);
});

// Windowの起動時処理
InitWindow()
</script>
