<script setup lang="ts">
import { MohistmcVersion } from 'app/src-electron/schema/version';
import { uniqueArrayDict } from 'src/scripts/objFillter';
import { useSystemStore } from 'src/stores/SystemStore';
import { useMainStore } from 'src/stores/MainStore';
import SsSelect from 'src/components/util/base/ssSelect.vue';

const sysStore = useSystemStore()
const mainStore = useMainStore()

const mohists = sysStore.serverVersions.get('mohistmc') as MohistmcVersion[]

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
      :options="uniqueArrayDict(mohists, 'id')"
      :label="$t('home.version.versionType')"
      option-label="id"
      :disable="mohists === void 0"
      class="col"
    />
    <SsSelect
      v-model="mainStore.world.version"
      :options="mohists?.filter(ver => ver.id === mainStore.world.version.id).map((val, idx) => {
        return {
          data: val,
          label:
            idx === 0
              ? `${getNumberName(val.number, val.forge_version)} (推奨)`
              : getNumberName(val.number, val.forge_version)
        }
      })"
      label="ビルド番号 (変更不要)"
      option-label="label"
      option-value="data"
      :disable="mohists === void 0"
      class="col"
    />
  </div>
</template>