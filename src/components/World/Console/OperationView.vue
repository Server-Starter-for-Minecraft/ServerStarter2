<script setup lang="ts">
import { $T } from 'src/i18n/utils/tFunc';
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

type BtnType = {
  icon: string;
  label: string;
  disable?: () => boolean;
  click: () => void;
};
const menuBtns: BtnType[] = [
  {
    icon: 'restart_alt',
    label: $T('console.reboot.btn'),
    disable: () => !isRunning(),
    click: reboot,
  },
  {
    icon: 'search',
    label: $T('console.search.btn'),
    click: () => (consoleOpeStore.isSearchVisible = true),
  },
  // {
  //   icon: 'palette',
  //   label: $T('console.appearance'),
  //   click: () => {},
  // },
];

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

function isViewConsole() {
  return isCheckingLog() || isRunning();
}
function isCheckingLog() {
  return consoleStore.status(mainStore.selectedWorldID) === 'CheckLog';
}
function isRunning() {
  return consoleStore.status(mainStore.selectedWorldID) === 'Running';
}
</script>

<template>
  <div class="row q-mx-md" style="padding-top: 14px; padding-bottom: 14px">
    <q-space />
    <SsBtn
      v-if="!isCheckingLog()"
      dense
      is-capital
      icon="stop"
      :label="
        $T(
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

    <q-btn-dropdown
      outline
      dense
      auto-close
      icon="construction"
      label="Tools"
      width="100px"
      :disable="!isViewConsole()"
      class="q-mx-sm"
    >
      <q-list dense bordered>
        <q-item
          v-for="btn in menuBtns"
          clickable
          :disable="btn.disable?.()"
          @click="btn.click"
          :key="btn.icon"
        >
          <q-item-section avatar>
            <q-icon :name="btn.icon" />
          </q-item-section>
          <q-item-section>{{ btn.label }}</q-item-section>
        </q-item>
      </q-list>
    </q-btn-dropdown>

    <q-input
      v-if="!isCheckingLog()"
      dense
      filled
      clearable
      :disable="disable || consoleStore.isClickedBtn(mainStore.selectedWorldID)"
      v-model="consoleOpeStore.command"
      v-on:keydown.enter="() => consoleOpeStore.sendCommand()"
      v-on:keydown.up="consoleOpeStore.upKey()"
      v-on:keydown.down="consoleOpeStore.downKey()"
      :placeholder="$T('console.command')"
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

    <SsBtn
      v-if="isCheckingLog()"
      dense
      is-capital
      icon="close"
      :label="$T('general.close')"
      @click="closeLog"
      class="q-py-sm"
    />
  </div>
</template>
