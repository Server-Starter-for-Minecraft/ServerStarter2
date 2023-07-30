<script setup lang="ts">
import { ForgeVersion } from 'app/src-electron/schema/version';
import { uniqueArrayDict } from 'src/scripts/objFillter';
import { useSystemStore } from 'src/stores/SystemStore';
import { useMainStore } from 'src/stores/MainStore';
import SsSelect from 'src/components/util/base/ssSelect.vue';

const sysStore = useSystemStore()
const mainStore = useMainStore()

const forges = sysStore.serverVersions.get('forge') as ForgeVersion[]
</script>

<template>
  <div class="row justify-between q-gutter-md">
    <SsSelect
      v-model="mainStore.world.version"
      :options="uniqueArrayDict(forges, 'id')"
      :label="$t('home.version.versionType')"
      option-label="id"
      :disable="forges === void 0"
      class="col"
    />
    <SsSelect
      v-model="mainStore.world.version"
      :options="forges?.filter(ver => ver.id === mainStore.world.version.id).map((val, idx) => {
        return { data: val, label: idx === 0 ? `${val.forge_version} (推奨)` : val.forge_version}
      })"
      label="ビルド番号"
      option-label="label"
      option-value="data"
      :disable="forges === void 0"
      class="col"
    />
  </div>
</template>