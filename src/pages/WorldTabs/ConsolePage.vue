<script setup lang="ts">
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';
import OperationView from 'src/components/World/Console/OperationView.vue';
import ReadyView from 'src/components/World/Console/ReadyView.vue';
import RunningView from 'src/components/World/Console/RunningView.vue';
import StopView from 'src/components/World/Console/StopView.vue';

const mainStore = useMainStore();
const consoleStore = useConsoleStore();
// ワールドタブを選択せずにこの画面に到達した場合にStatusなどをセットする
consoleStore.initTab(mainStore.selectedWorldID);
</script>

<template>
  <div class="wrap-column fit">
    <div class="column" style="flex: 1 1 0">
      <StopView />
      <ReadyView />
      <RunningView />
    </div>

    <q-separator inset />

    <OperationView
      :disable="consoleStore.status(mainStore.selectedWorldID) !== 'Running'"
    />
  </div>
</template>

<style scoped lang="scss">
// class="column"を使うと，改行不要の設定が入ることで，
// 幅の調整が効かなくなってしまうため，縦に並べるスタイルを独自に定義
.wrap-column {
  flex-direction: column;
  display: flex;
}
</style>
