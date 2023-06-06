<script setup lang="ts">
import { useConsoleStore } from 'src/stores/ConsoleStore';
import StopView from 'src/components/World/Console/StopView.vue'
import ReadyView from 'src/components/World/Console/ReadyView.vue'
import RunningView from 'src/components/World/Console/RunningView.vue'
import OperationView from 'src/components/World/Console/OperationView.vue'

const consoleStore = useConsoleStore()
// ワールドタブを選択せずにこの画面に到達した場合にStatusなどをセットする
consoleStore.setTab()
</script>

<template>
  <div class="column fit">
    <div class="column" style="flex: 1 1 0;">
      <StopView/>
      <ReadyView/>
      <RunningView/>
    </div>

    <q-separator inset/>

    <OperationView :disable="consoleStore.status !== 'Running'"/>
  </div>
</template>