<script setup lang="ts">
import { getCssVar } from 'quasar';
import { assets } from 'src/assets/assets'
import { runServer, useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';
import SsBtn from 'src/components/util/base/ssBtn.vue';

interface Prop {
  textFontSize: number
  to?: string
}
defineProps<Prop>()

const mainStore = useMainStore()
const consoleStore = useConsoleStore()

function stopServer() {
  consoleStore.clickedStopBtn(mainStore.selectedWorldID)
  window.API.sendCommand(mainStore.selectedWorldID, 'stop')
}
</script>

<template>
  <ss-btn
    v-if="consoleStore.status(mainStore.world.id) !== 'Running'"
    free-width
    color="primary"
    :disable="mainStore.errorWorlds.has(mainStore.world.id) || consoleStore.status(mainStore.world.id) === 'Ready'"
    :to="to"
    @click="runServer"
    :style="{'height': `${3 ** (textFontSize + 0.1)}rem`}"
    >
    <!-- フォントサイズに応じてアイコンのサイズが自動で調整されるようにする -->
    <q-avatar square class="q-mr-md q-my-sm" :size="`${8 ** (textFontSize - 1) + 1}rem`">
      <q-icon :name="assets.svg.systemLogo_filled(getCssVar('primary')?.replace('#', '%23'))" />
    </q-avatar>
    <span :style="{ 'font-size': `${textFontSize}rem` }">{{ $t('console.boot', { name: mainStore.world.name }) }}</span>
  </ss-btn>

  <!-- 再起動時は状態を示すだけのため，ボタンとしての機能を持たせない -->
  <ss-btn
    v-else-if="consoleStore.isClickedReboot(mainStore.selectedWorldID)"
    free-width
    disable
    :style="{'height': `${3 ** (textFontSize + 0.1)}rem`}"
  >
    <!-- フォントサイズに応じてアイコンのサイズが自動で調整されるようにする -->
    <q-avatar icon="restart_alt" :size="`${textFontSize + 0.8}rem`" class="q-mr-md" />
    <span :style="{ 'font-size': `${textFontSize}rem` }">
      {{ $t('console.reboot.progressWithName', { name: mainStore.world.name }) }}
    </span>
  </ss-btn>

  <ss-btn
    v-else
    free-width
    color="negative"
    :disable="consoleStore.isClickedBtn(mainStore.selectedWorldID)"
    @click="stopServer"
    :style="{'height': `${3 ** (textFontSize + 0.1)}rem`}"
  >
    <!-- フォントサイズに応じてアイコンのサイズが自動で調整されるようにする -->
    <q-avatar icon="square" :size="`${textFontSize + 0.8}rem`" class="q-mr-md" />
    <span :style="{ 'font-size': `${textFontSize}rem` }">
      {{ $t(consoleStore.isClickedBtn(mainStore.selectedWorldID) ? 'console.stop.progressWithName' : 'console.stop.withName', { name: mainStore.world.name }) }}
    </span>
  </ss-btn>
</template>