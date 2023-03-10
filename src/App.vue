<template>
  <router-view />
</template>

<script setup lang="ts">
import { addConsole } from './stores/ConsoleStore';

// メッセージをコンソールに追加
window.ConsoleAPI.onAddConsole((_event, value) => {
  addConsole(value[0]);
});
</script>
