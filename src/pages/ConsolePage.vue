<script setup lang="ts">
import { ref } from 'vue';
import { useConsoleStore } from '../stores/ConsoleStore';

// 自動スクロール
function autoScroll() {
  let container = document.getElementById('scroll');
  container?.scrollIntoView(false);
  if (container != null) {
    container.scrollTop = container.scrollHeight;
  }
}

// コマンドの送信
function sendCommand(sendCommand: string) {
  window.API.sendCommand(sendCommand);
  command.value = '';
}

const command = ref('');

// コンソール表示
window.API.onAddConsole(() => {
  autoScroll();
});
</script>

<template>
  <div class="q-pa-md">
    <div id="scroll" class="q-pl-sm q-pt-sm console">
      <p
        v-for="item in useConsoleStore().console"
        :key="item"
        style="width: max-content"
      >
        {{ item }}<br />
      </p>
      <br />
    </div>
    <div class="row q-pt-md">
      <q-btn @click="sendCommand('stop')" color="red" label="stop" />
      <q-btn @click="sendCommand('reboot')" color="blue" label="reboot" />
      <q-input
        filled
        clearable
        v-model="command"
        v-on:keydown.enter="sendCommand(command)"
        label="Command"
      />
      <q-btn @click="sendCommand(command)" color="primary" label="send" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
p {
  font-size: 16pt;
  line-height: 1.2;
  margin: 0;
  font-family: 'Courier New', Courier, monospace;
}

.console {
  overflow: scroll;
  height: calc(90vh - 100px);
}
</style>
