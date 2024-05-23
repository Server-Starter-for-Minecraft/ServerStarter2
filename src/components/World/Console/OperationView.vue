<script setup lang="ts">
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';
import { useConsoleOpeStore } from 'src/stores/WorldTabs/ConsoleOperationStore';
import SsBtn from 'src/components/util/base/ssBtn.vue';

interface Prop {
  disable?: boolean;
}
defineProps<Prop>();

const mainStore = useMainStore();
const consoleStore = useConsoleStore();
const consoleOpeStore = useConsoleOpeStore();

function stop() {
  consoleStore.clickedStopBtn(mainStore.selectedWorldID);
  window.API.sendCommand(mainStore.selectedWorldID, 'stop');
}

async function reboot() {
  const worldID = mainStore.selectedWorldID;
  consoleStore.clickedRebootBtn(worldID);
  await window.API.invokeReboot(worldID);
  consoleStore.resetReboot(worldID);
}

function closeLog() {
  consoleStore.initTab(mainStore.selectedWorldID, true);
}
</script>

<template>
  <div
    v-if="consoleStore.status(mainStore.selectedWorldID) !== 'CheckLog'"
    class="row q-mx-md"
    style="padding-top: 14px; padding-bottom: 14px"
  >
    <SsBtn
      dense
      is-capital
      icon="stop"
      :label="
        $t(
          consoleStore.isClickedStop(mainStore.selectedWorldID)
            ? 'console.stop.progress'
            : 'console.stop.btn'
        )
      "
      color="negative"
      :width="
        consoleStore.isClickedStop(mainStore.selectedWorldID)
          ? '150px'
          : '100px'
      "
      :disable="disable || consoleStore.isClickedBtn(mainStore.selectedWorldID)"
      @click="stop"
    />
    <SsBtn
      dense
      is-capital
      icon="restart_alt"
      :label="
        $t(
          consoleStore.isClickedReboot(mainStore.selectedWorldID)
            ? 'console.reboot.progress'
            : 'console.reboot.btn'
        )
      "
      :width="
        consoleStore.isClickedReboot(mainStore.selectedWorldID)
          ? '150px'
          : '100px'
      "
      :disable="disable || consoleStore.isClickedBtn(mainStore.selectedWorldID)"
      @click="reboot"
      class="q-mx-sm"
    />
    <q-input
      dense
      filled
      clearable
      :disable="disable || consoleStore.isClickedBtn(mainStore.selectedWorldID)"
      v-model="consoleOpeStore.command"
      v-on:keydown.enter="() => consoleOpeStore.sendCommand()"
      v-on:keydown.up="consoleOpeStore.upKey()"
      v-on:keydown.down="consoleOpeStore.downKey()"
      :placeholder="$t('console.command')"
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

  <div
    v-else
    class="row q-mx-md"
    style="padding-top: 14px; padding-bottom: 14px"
  >
    <q-space />
    <SsBtn
      dense
      is-capital
      icon="close"
      :label="$t('general.close')"
      @click="closeLog"
      class="q-py-sm"
    />
  </div>
</template>
