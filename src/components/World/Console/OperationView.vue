<script setup lang="ts">
import { useConsoleOpeStore } from 'src/stores/WorldTabs/ConsoleOperationStore';
import iconButton from 'src/components/util/iconButton.vue';

interface Prop {
  disable?: boolean
}
defineProps<Prop>()

const consoleOpeStore = useConsoleOpeStore()
</script>

<template>
  <div class="row q-pa-md">
    <iconButton icon="stop_circle" @click="consoleOpeStore.sendCommand('stop')" color="red" text="stop" :disable="disable"/>
    <iconButton icon="restart_alt" @click="consoleOpeStore.sendCommand('reboot')" color="blue" text="reboot" :disable="disable"/>
    <q-input
      filled
      clearable
      :disable="disable"
      v-model="consoleOpeStore.command"
      v-on:keydown.enter="() => consoleOpeStore.sendCommand()"
      v-on:keydown.up="consoleOpeStore.upKey()"
      v-on:keydown.down="consoleOpeStore.downKey()"
      label="Command"
      class="col"
    />
    <iconButton icon="send" @click="consoleOpeStore.sendCommand" color="primary" text="send" :disable="disable"/>
  </div>
</template>