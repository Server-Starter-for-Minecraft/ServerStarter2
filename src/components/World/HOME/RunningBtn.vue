<script setup lang="ts">
import { getCssVar } from 'quasar';
import { assets } from 'src/assets/assets'
import { runServer } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';
import SsBtn from 'src/components/util/base/ssBtn.vue';

interface Prop {
  testFontSize: number
  to?: string
}
defineProps<Prop>()

const mainStore = useMainStore()
</script>

<template>
  <ss-btn
    free-width
    color="primary"
    :disable="mainStore.errorWorlds.has(mainStore.world.id)"
    :to="to"
    @click="runServer"
  >
    <!-- フォントサイズに応じてアイコンのサイズが自動で調整されるようにする -->
    <q-avatar square class="q-mr-md q-my-sm" :size="`${8**(testFontSize-1) + 1}rem`">
      <q-icon :name="assets.svg.systemLogo_filled(getCssVar('primary')?.replace('#', '%23'))" />
    </q-avatar>
    <span :style="{'font-size': `${testFontSize}rem`}">{{ $t('console.boot', { name: mainStore.world.name }) }}</span>
  </ss-btn>
</template>