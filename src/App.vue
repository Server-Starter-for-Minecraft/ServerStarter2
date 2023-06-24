<script setup lang="ts">
import ConsoleList from './components/ConsoleList.vue';
import ConsoleWindow from './components/ConsoleWindow.vue';
import OnDialog from './components/OnDialog.vue';
</script>
<template>
  <div class="row fullscreen">
    <ConsoleList />
    <ConsoleWindow class="col" />
    <OnDialog />
  </div>
</template>
