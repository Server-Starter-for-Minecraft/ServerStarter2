<script setup lang="ts">
import { useConsoleStore } from 'src/stores/ConsoleStore';
import StopView from 'src/components/World/Console/StopView.vue'
import ReadyView from 'src/components/World/Console/ReadyView.vue'
import RunningView from 'src/components/World/Console/RunningView.vue'

const consoleStore = useConsoleStore()
consoleStore.setTab()
</script>

<template>
  <StopView/>
  <ReadyView/>
  <RunningView/>
</template>