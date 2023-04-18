<template>
  <router-view />
</template>

<script setup lang="ts">
import { consoleStore } from './stores/ConsoleStore';
import { useQuasar } from 'quasar'

// ダークモードを有効にする
const $q = useQuasar()
$q.dark.set('auto')

// メッセージをコンソールに追加
window.ConsoleAPI.onAddConsole((_event, value) => {
  consoleStore().console.push(value[0]);
});
</script>
