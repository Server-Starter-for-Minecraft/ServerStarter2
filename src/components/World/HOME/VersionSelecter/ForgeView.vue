<script setup lang="ts">
import { AllForgeVersion } from 'app/src-electron/schema/version';
import { useSystemStore } from 'src/stores/SystemStore';
import { useMainStore } from 'src/stores/MainStore';
import SsSelect from 'src/components/util/base/ssSelect.vue';

const sysStore = useSystemStore()
const mainStore = useMainStore()

const forges = sysStore.serverVersions.get('forge') as AllForgeVersion | undefined
const forgeVerOps = forges?.map(
  ver => { return { id: ver.id, type: 'forge' as const, forge_version: ver.recommended ?? ver.forge_versions[0] }}
)
const forgeBuildOps = () => {
  const forgeVers = forges?.filter(ver => ver.id === mainStore.world.version.id)[0].forge_versions
  return forgeVers?.map(fv => { return { id: mainStore.world.version.id, type: 'forge' as const, forge_version: fv }})
}

// forgeでないときには最新のバージョンを割り当てる
if (mainStore.world.version.type !== 'forge' && forgeVerOps !== void 0) {
  mainStore.world.version = forgeVerOps[0]
}
</script>

<template>
  <div class="row justify-between q-gutter-md">
    <SsSelect
      v-model="mainStore.world.version"
      :options="forgeVerOps"
      :label="$t('home.version.versionType')"
      option-label="id"
      :disable="forges === void 0"
      class="col"
      style="min-width: 8rem;"
    />
    <SsSelect
      v-model="mainStore.world.version"
      :options="forgeBuildOps()?.map(val => {
        return { data: val, label: forgeVerOps?.map(v => v.forge_version).includes(val.forge_version) ? `${val.forge_version} (${$t('home.version.recommend')})` : val.forge_version}
      })"
      :label="$t('home.version.buildNumber')"
      option-label="label"
      option-value="data"
      :disable="forges === void 0"
      class="col"
      style="min-width: 8rem;"
    />
  </div>
</template>