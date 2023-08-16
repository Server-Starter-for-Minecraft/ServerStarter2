<script setup lang="ts">
import { AllMohistmcVersion } from 'app/src-electron/schema/version';
import { useSystemStore } from 'src/stores/SystemStore';
import { useMainStore } from 'src/stores/MainStore';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import SsSelect from 'src/components/util/base/ssSelect.vue';

const sysStore = useSystemStore()
const mainStore = useMainStore()
const consoleStore = useConsoleStore()

const mohists = sysStore.serverVersions.get('mohistmc') as AllMohistmcVersion | undefined
const mohistVerOps = mohists?.map(
  ver => { return {
    id: ver.id,
    type: 'mohistmc' as const,
    forge_version: ver.builds[0].forge_version,
    number: ver.builds[0].number
  }}
)
const mohistNumberOps = () => {
  const builds = mohists?.filter(ver => ver.id === mainStore.world.version.id)[0].builds
  return builds?.map(b => { return {
    id: mainStore.world.version.id,
    type: 'mohistmc' as const,
    forge_version: b.forge_version,
    number: b.number
  }})
}

// mohistでないときには最新のバージョンを割り当てる
if (mainStore.world.version.type !== 'mohistmc' && mohistVerOps !== void 0) {
  mainStore.world.version = mohistVerOps[0]
}

function getNumberName(n: number, forgeVersion?: string) {
  if (forgeVersion !== void 0) {
    return `${n} (Forge: ${forgeVersion})`
  }
  else {
    return n
  }
}
</script>

<template>
  <div class="row justify-between q-gutter-md">
    <SsSelect
      v-model="mainStore.world.version"
      :options="mohistVerOps"
      :label="$t('home.version.versionType')"
      option-label="id"
      :disable="mohists === void 0 || consoleStore.status(mainStore.world.id) !== 'Stop'"
      class="col"
      style="min-width: 8rem;"
    />
    <SsSelect
      v-model="mainStore.world.version"
      :options="mohistNumberOps()?.map((val, idx) => {
        return {
          data: val,
          label:
            idx === 0
              ? `${getNumberName(val.number, val.forge_version)} (${$t('home.version.recommend')})`
              : getNumberName(val.number, val.forge_version)
        }
      })"
      :label="$t('home.version.buildNumber') + $t('home.version.notChange')"
      option-label="label"
      option-value="data"
      :disable="mohists === void 0 || consoleStore.status(mainStore.world.id) !== 'Stop'"
      class="col"
      style="min-width: 8rem;"
    />
  </div>
</template>