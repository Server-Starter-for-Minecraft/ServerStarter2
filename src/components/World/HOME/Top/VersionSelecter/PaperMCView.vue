<script setup lang="ts">
import { AllPapermcVersion } from 'app/src-electron/schema/version';
import { useSystemStore } from 'src/stores/SystemStore';
import { useMainStore } from 'src/stores/MainStore';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import SsSelect from 'src/components/util/base/ssSelect.vue';

const sysStore = useSystemStore()
const mainStore = useMainStore()
const consoleStore = useConsoleStore()

const papers = sysStore.serverVersions.get('papermc') as AllPapermcVersion | undefined
const paperVerOps = papers?.map(
  ver => { return { id: ver.id, type: 'papermc' as const, build: ver.builds[0] }}
)
const paperBuildOps = () => {
  const builds = papers?.filter(ver => ver.id === mainStore.world.version.id)[0].builds
  return builds?.map(b => { return { id: mainStore.world.version.id, type: 'papermc' as const, build: b }})
}

// paperでないときには最新のバージョンを割り当てる
if (mainStore.world.version.type !== 'papermc' && paperVerOps !== void 0) {
  mainStore.world.version = paperVerOps[0]
}
</script>

<template>
  <div class="row justify-between q-gutter-md">
    <SsSelect
      v-model="mainStore.world.version"
      :options="paperVerOps?.map(
        (ver, idx) => { return {
          data: ver,
          label: idx === 0 ? `${ver.id}【${$t('home.version.latestVersion')}】` : ver.id
        }}
      )"
      :label="$t('home.version.versionType')"
      option-label="label"
      option-value="data"
      :disable="papers === void 0 || consoleStore.status(mainStore.world.id) !== 'Stop'"
      class="col"
      style="min-width: 8rem;"
    />
    <SsSelect
      v-model="mainStore.world.version"
      :options="paperBuildOps()?.map((val, idx) => {
        return { data: val, label: idx === 0 ? `${val.build} (${$t('home.version.recommend')})` : val.build}
      })"
      :label="$t('home.version.buildNumber')"
      option-label="label"
      option-value="data"
      :disable="papers === void 0 || consoleStore.status(mainStore.world.id) !== 'Stop'"
      class="col"
      style="min-width: 8rem;"
    />
  </div>
</template>