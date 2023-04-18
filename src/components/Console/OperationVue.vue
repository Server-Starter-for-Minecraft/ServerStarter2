<script setup lang="ts">
import { ref } from 'vue';
import IconButton from '../util/iconButton.vue';

// コマンドの送信
function sendCommand(sendCommand: string) {
  window.API.sendCommand(sendCommand);
  command.value = '';
}

const command = ref('');
</script>

<template>
  <div class="row q-pt-md">
    <IconButton icon="stop_circle" @click="sendCommand('stop')" color="red" text="stop" class="col"/>
    <IconButton icon="restart_alt" @click="sendCommand('reboot')" color="blue" text="reboot" class="col"/>
    <q-input
      filled
      clearable
      v-model="command"
      v-on:keydown.enter="sendCommand(command)"
      label="Command"
      class="col-8 col-auto"
    />
    <IconButton icon="send" @click="sendCommand(command)" color="primary" text="send" class="col"/>
  </div>
</template>