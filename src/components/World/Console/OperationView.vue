<script setup lang="ts">
import { useMainStore } from 'src/stores/MainStore';
import { useConsoleOpeStore } from 'src/stores/WorldTabs/ConsoleOperationStore';
import SsBtn from 'src/components/util/base/ssBtn.vue';

interface Prop {
  disable?: boolean
}
defineProps<Prop>()

const mainStore = useMainStore()
const consoleOpeStore = useConsoleOpeStore()

function reboot() {
  window.API.invokeReboot(mainStore.selectedWorldID)
}
</script>

<template>
  <div class="row q-mx-md" style="padding-top: 14px; padding-bottom: 14px;">
    <SsBtn
      dense
      is-capital
      icon="stop"
      :label="$t('console.stop')"
      color="red"
      width="100px"
      :disable="disable"
      @click="consoleOpeStore.sendCommand('stop')"
    />
    <SsBtn
      dense
      is-capital
      icon="restart_alt"
      :label="$t('console.reboot')"
      width="100px"
      :disable="disable"
      @click="reboot"
      class="q-mx-sm"
    />
    <q-input
      dense
      filled
      clearable
      :disable="disable"
      v-model="consoleOpeStore.command"
      v-on:keydown.enter="() => consoleOpeStore.sendCommand()"
      v-on:keydown.up="consoleOpeStore.upKey()"
      v-on:keydown.down="consoleOpeStore.downKey()"
      placeholder="Command"
      class="col"
    >
      <template #append>
        <q-btn
          dense
          flat
          icon="send"
          color="primary"
          :disable="disable"
          @click="() => consoleOpeStore.sendCommand()"
        />
      </template>
    </q-input>
  </div>
</template>