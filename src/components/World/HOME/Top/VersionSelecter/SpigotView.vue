<script setup lang="ts">
import { AllSpigotVersion } from 'app/src-electron/schema/version';
import { useMainStore } from 'src/stores/MainStore';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import SsSelect from 'src/components/util/base/ssSelect.vue';

interface Prop {
  versionData: AllSpigotVersion
}
const prop = defineProps<Prop>()

const mainStore = useMainStore()
const consoleStore = useConsoleStore()

const spigotOps = () => { return prop.versionData.map(
  ver => { return { id: ver.id, type: 'spigot' as const }}
)}

// spigotでないときには最新のバージョンを割り当てる
if (mainStore.world.version.type !== 'spigot') {
  mainStore.world.version = spigotOps()[0]
}
</script>

<template>
  <SsSelect
    v-model="mainStore.world.version"
    :options="spigotOps()?.map(
      (ver, idx) => { return {
        data: ver,
        label: idx === 0 ? `${ver.id}【${$t('home.version.latestVersion')}】` : ver.id
      }}
    )"
    :label="$t('home.version.versionType')"
    option-label="label"
    option-value="data"
    :disable="consoleStore.status(mainStore.world.id) !== 'Stop'"
    class="col"
  />
</template>