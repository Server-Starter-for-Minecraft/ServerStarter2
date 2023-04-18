<template>
  <router-view />
</template>

<script setup lang="ts">
import { useConsoleStore } from './stores/ConsoleStore';
import { useQuasar } from 'quasar';

// ダークモードを有効にする
const $q = useQuasar();
$q.dark.set('auto');

// メッセージをコンソールに追加
window.API.onAddConsole((_event, value) => {
  useConsoleStore().console.push(value);
});
</script>
