<script setup lang="ts">
import { ref } from 'vue';
import IconButton from '../util/iconButton.vue';

// コマンドの送信
function sendCommand(sendCommand: string) {
  inputCommands.push(sendCommand);
  showIdx = inputCommands.length
  window.API.sendCommand(sendCommand);
  command.value = '';
}

function upKey() {
  showIdx--
  if (showIdx < 0) showIdx = 0;
  command.value = inputCommands[showIdx]
}
function downKey() {
  showIdx++
  if (showIdx > inputCommands.length) showIdx = inputCommands.length;
  command.value = inputCommands[showIdx]
}

let showIdx = 0
const inputCommands = [] as string[]
const command = ref('');
</script>

<template>
  <div class="row q-pa-md">
    <IconButton icon="stop_circle" @click="sendCommand('stop')" color="red" text="stop" class="col"/>
    <IconButton icon="restart_alt" @click="sendCommand('reboot')" color="blue" text="reboot" class="col"/>
    <q-input
      filled
      clearable
      v-model="command"
      v-on:keydown.enter="sendCommand(command)"
      v-on:keydown.up="upKey"
      v-on:keydown.down="downKey"
      label="Command"
      class="col-8 col-auto"
    />
    <IconButton icon="send" @click="sendCommand(command)" color="primary" text="send" class="col"/>
  </div>
</template>