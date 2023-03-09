<script setup lang="ts">
import { ref } from 'vue';
import { addConsole, getStore } from './ConsoleStore';

// 自動スクロール
function autoScroll() {
  let container = document.getElementById('scroll')
  container?.scrollIntoView(false)
  if (container != null) {
    container.scrollTop = container.scrollHeight
  }
}

// コマンドの送信
function sendCommand(command:string) {
  console.log('send_command:'+command)
  window.ConsoleAPI.sendCommand(command)
}


const items = getStore()
const command = ref('')

// コンソール表示
window.ConsoleAPI.onAddConsole((_event, value) => {
  addConsole(value[0])
  autoScroll()
})
</script>

<template>
  <div class="q-pa-md">
    <div id="scroll" class="q-pl-sm q-pt-sm console">
      <div v-for="item in items.brConsole" :key="item" style="width: max-content;">
        <p>{{ item }}</p>
      </div>
    </div>
    <div class="row q-pt-md">
      <q-btn @click="sendCommand('stop')" color="red" label="stop"/>
      <q-btn @click="sendCommand('reboot')" color="green" label="reboot"/>
      <q-input filled clearable v-model="command" v-on:keydown.enter="sendCommand(command)" label="Command"/>
      <q-btn @click="sendCommand(command)" color="primary" label="send"/>
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
  background-color: lightgray;
  overflow: scroll;
  height: calc(90vh - 100px);
}
</style>