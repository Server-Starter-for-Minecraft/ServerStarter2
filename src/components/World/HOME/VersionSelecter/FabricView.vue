<script setup lang="ts">
import { ref } from 'vue';
import { FabricVersion } from 'app/src-electron/schema/version';
import { uniqueArrayDict } from 'src/scripts/objFillter'
import { useSystemStore } from 'src/stores/SystemStore';
import { useMainStore } from 'src/stores/MainStore';
import SsSelect from 'src/components/util/base/ssSelect.vue';

const sysStore = useSystemStore()
const mainStore = useMainStore()

const isRelease = ref(false)
const fabrics = sysStore.serverVersions.get('fabric') as FabricVersion[]
const fabricInstaller = ref(mainStore.world.version.type === 'fabric' ? mainStore.world.version.installer : fabrics[0].installer)
const fabricLoader = ref(mainStore.world.version.type === 'fabric' ? mainStore.world.version.loader : fabrics[0].loader)
</script>

<template>
  <div class="row justify-between q-gutter-md q-pb-md">
    <SsSelect
      v-model="mainStore.world.version"
      :options="uniqueArrayDict(fabrics.filter(v => !isRelease || v.release), 'id')"
      :label="$t('home.version.versionType')"
      option-label="id"
      :disable="fabrics === void 0"
      class="col"
    />
    <div class="column items-end">
      <span>選択一覧に表示するバージョン</span>
      <q-toggle
        v-model="isRelease"
        :label="isRelease ? 'Releaseのみ' : '全てのバージョン'"
        left-label
        style="width: fit-content;"
      />
    </div>
  </div>

  <div class="row justify-between q-gutter-md">
    <SsSelect
      v-model="fabricInstaller"
      @update:modelValue="(mainStore.world.version as FabricVersion).installer = fabricInstaller"
      :options="uniqueArrayDict(
        fabrics, 'installer'
      ).map(
        (v, i) => { return { data: v.installer, label: i === 0 ? `${v.installer} (推奨)` : v.installer }}
      )"
      label="インストーラー"
      option-label="label"
      option-value="data"
      :disable="fabrics === void 0"
      class="col"
    />
    <SsSelect
      v-model="fabricLoader"
      @update:modelValue="(mainStore.world.version as FabricVersion).loader = fabricLoader"
      :options="uniqueArrayDict(
        fabrics, 'loader'
      ).map(
        (v, i) => { return { data: v.loader, label: i === 0 ? `${v.loader} (推奨)` : v.loader }}
      )"
      label="ローダー"
      option-label="label"
      option-value="data"
      :disable="fabrics === void 0"
      class="col"
    />
  </div>
</template>