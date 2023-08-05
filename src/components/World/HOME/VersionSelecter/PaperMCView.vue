<script setup lang="ts">
import { PapermcVersion } from 'app/src-electron/schema/version';
import { uniqueArrayDict } from 'src/scripts/objFillter';
import { useSystemStore } from 'src/stores/SystemStore';
import { useMainStore } from 'src/stores/MainStore';
import SsSelect from 'src/components/util/base/ssSelect.vue';

const sysStore = useSystemStore()
const mainStore = useMainStore()

const papers = (sysStore.serverVersions.get('papermc') as PapermcVersion[])
</script>

<template>
  <div class="row justify-between q-gutter-md">
    <SsSelect
      v-model="mainStore.world.version"
      :options="uniqueArrayDict(papers, 'id')"
      :label="$t('home.version.versionType')"
      option-label="id"
      :disable="papers === void 0"
      class="col"
    />
    <SsSelect
      v-model="mainStore.world.version"
      :options="papers?.filter(ver => ver.id === mainStore.world.version.id).map((val, idx) => {
        return { data: val, label: idx === 0 ? `${val.build} (${$t('home.version.recommend')})` : val.build}
      })"
      :label="$t('home.version.buildNumber')"
      option-label="label"
      option-value="data"
      :disable="papers === void 0"
      class="col"
    />
  </div>
</template>