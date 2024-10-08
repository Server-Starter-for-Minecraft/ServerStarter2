<script setup lang="ts">
import { getCssVar } from 'quasar';
import { assets } from 'src/assets/assets';
import { runServer, useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import SsI18nT from 'src/components/util/base/ssI18nT.vue';

interface Prop {
  textFontSize: number;
  to?: string;
}
defineProps<Prop>();

const mainStore = useMainStore();
const consoleStore = useConsoleStore();

function stopServer() {
  consoleStore.clickedStopBtn(mainStore.selectedWorldID);
  window.API.sendCommand(mainStore.selectedWorldID, 'stop');
}

function stopButtonState() {
  return consoleStore.isClickedBtn(mainStore.selectedWorldID)
    ? 'console.stop.progressWithName'
    : 'console.stop.withName';
}
</script>

<template>
  <ss-btn
    v-if="consoleStore.status(mainStore.selectedWorldID) !== 'Running'"
    free-width
    color="primary"
    :disable="
      mainStore.errorWorlds.has(mainStore.selectedWorldID) ||
      consoleStore.status(mainStore.selectedWorldID) !== 'Stop'
    "
    :to="to"
    @click="runServer"
    :style="{ height: `${3 ** (textFontSize + 0.1)}rem` }"
    class="row items-center"
  >
    <!-- フォントサイズに応じてアイコンのサイズが自動で調整されるようにする -->
    <q-avatar
      square
      class="q-mr-md q-my-sm"
      :size="`${8 ** (textFontSize - 1) + 1}rem`"
    >
      <q-icon
        :name="
          assets.svg.systemLogo_filled(
            getCssVar('primary')?.replace('#', '%23')
          )
        "
      />
    </q-avatar>

    <span
      class="col row"
      :style="{ 'font-size': `${textFontSize}rem`, right: 0, left: 0 }"
      style="white-space: pre-line"
    >
      <SsI18nT keypath="console.boot">
        &nbsp;
        <span class="text-omit col">{{ mainStore.world?.name }}</span> &nbsp;
      </SsI18nT>
    </span>
  </ss-btn>

  <!-- 再起動時は状態を示すだけのため，ボタンとしての機能を持たせない -->
  <ss-btn
    v-else-if="consoleStore.isClickedReboot(mainStore.selectedWorldID)"
    free-width
    disable
    :style="{ height: `${3 ** (textFontSize + 0.1)}rem` }"
    class="row items-center"
  >
    <!-- フォントサイズに応じてアイコンのサイズが自動で調整されるようにする -->
    <q-avatar
      icon="restart_alt"
      :size="`${textFontSize + 0.8}rem`"
      class="q-mr-md"
    />
    <span
      class="col row"
      :style="{ 'font-size': `${textFontSize}rem`, right: 0, left: 0 }"
      style="white-space: pre-line"
    >
      <SsI18nT keypath="console.reboot.progressWithName">
        &nbsp;
        <span class="text-omit col">
          {{ mainStore.world?.name }}
        </span>
        &nbsp;
      </SsI18nT>
    </span>
  </ss-btn>

  <ss-btn
    v-else
    free-width
    color="negative"
    :disable="consoleStore.isClickedBtn(mainStore.selectedWorldID)"
    @click="stopServer"
    :style="{ height: `${3 ** (textFontSize + 0.1)}rem` }"
    class="row items-center"
  >
    <!-- フォントサイズに応じてアイコンのサイズが自動で調整されるようにする -->
    <q-avatar
      icon="square"
      :size="`${textFontSize + 0.8}rem`"
      class="q-mr-md"
    />

    <span
      class="col row"
      :style="{ 'font-size': `${textFontSize}rem`, right: 0, left: 0 }"
      style="white-space: pre-line"
    >
      <SsI18nT :keypath="stopButtonState()">
        &nbsp;
        <span class="text-omit col">
          {{ mainStore.world?.name }}
        </span>
        &nbsp;
      </SsI18nT>
    </span>
  </ss-btn>
</template>
