<script setup lang="ts">
import { ref } from 'vue';
import { useMainStore } from 'src/stores/MainStore';
import iconButton from 'src/components/util/iconButton.vue';

interface Prop {
  disable?: boolean
}
defineProps<Prop>()

const mainStore = useMainStore()
// TODO: inputCommandsがComponentの再読み込みによってリセットされる問題の修正
// inputCommandsはWorldごとに分けずに全体で１つのみ宣言
let showIdx = 0
const inputCommands = [] as string[]
const command = ref('');

/**
 * コマンドの送信
 */
function sendCommand(sendCommand: string) {
  if (sendCommand !== '') {
    inputCommands.push(sendCommand);
    showIdx = inputCommands.length
    window.API.sendCommand(mainStore.selectedWorldID, sendCommand);
    command.value = '';
  }
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
</script>

<template>
  <div class="row q-pa-md">
    <iconButton icon="stop_circle" @click="sendCommand('stop')" color="red" text="stop" :disable="disable" class="col"/>
    <iconButton icon="restart_alt" @click="sendCommand('reboot')" color="blue" text="reboot" :disable="disable" class="col"/>
    <q-input
      filled
      clearable
      :disable="disable"
      v-model="command"
      v-on:keydown.enter="sendCommand(command)"
      v-on:keydown.up="upKey"
      v-on:keydown.down="downKey"
      label="Command"
      class="col-8 col-auto"
    />
    <iconButton icon="send" @click="sendCommand(command)" color="primary" text="send" :disable="disable" class="col"/>
  </div>
</template>