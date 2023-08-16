<script setup lang="ts">
import { ref } from 'vue';
import { AllFabricVersion, FabricVersion } from 'app/src-electron/schema/version';
import { useSystemStore } from 'src/stores/SystemStore';
import { useMainStore } from 'src/stores/MainStore';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import SsSelect from 'src/components/util/base/ssSelect.vue';

const sysStore = useSystemStore()
const mainStore = useMainStore()
const consoleStore = useConsoleStore()

const isRelease = ref(false)
const fabrics = sysStore.serverVersions.get('fabric') as AllFabricVersion | undefined
const fabricVerOps = fabrics?.games.map(
  ver => { return {
    id: ver.id,
    type: 'fabric' as const,
    release: ver.release,
    loader: fabrics.loaders[0],
    installer: fabrics.installers[0]
  }}
)

const fabricInstaller = ref(fabrics?.installers[0])
const fabricLoader = ref(fabrics?.loaders[0])

// fabricでないときには最新のバージョンを割り当てる
if (mainStore.world.version.type !== 'fabric' && fabricVerOps !== void 0) {
  mainStore.world.version = fabricVerOps[0]
}
</script>

<template>
  <div class="row justify-between q-gutter-md q-pb-md">
    <SsSelect
      v-model="mainStore.world.version"
      :options="fabricVerOps"
      :label="$t('home.version.versionType')"
      option-label="id"
      :disable="fabrics === void 0 || consoleStore.status(mainStore.world.id) !== 'Stop'"
      class="col"
      style="min-width: 8rem;"
    />
    <div class="column items-end">
      <span>{{ $t('home.version.displayVersion') }}</span>
      <q-toggle
        v-model="isRelease"
        :label="isRelease ? $t('home.version.onlyReleased') : $t('home.version.allVersions')"
        left-label
        :disable="consoleStore.status(mainStore.world.id) !== 'Stop'"
        style="width: fit-content;"
      />
    </div>
  </div>

  <div class="row justify-between q-gutter-md">
    <SsSelect
      v-model="fabricInstaller"
      @update:modelValue="(newVal: string) => (mainStore.world.version as FabricVersion).installer = newVal"
      :options="fabrics?.installers.map(
        (installer, i) => { return { data: installer, label: i === 0 ? `${installer} (${$t('home.version.recommend')})` : installer }}
      )"
      :label="$t('home.version.installer')"
      option-label="label"
      option-value="data"
      :disable="fabrics === void 0 || consoleStore.status(mainStore.world.id) !== 'Stop'"
      class="col"
      style="min-width: 8rem;"
    />
    <SsSelect
      v-model="fabricLoader"
      @update:modelValue="(newVal: string) => (mainStore.world.version as FabricVersion).loader = newVal"
      :options="fabrics?.loaders.map(
        (loader, i) => { return { data: loader, label: i === 0 ? `${loader} (${$t('home.version.recommend')})` : loader }}
      )"
      :label="$t('home.version.loader')"
      option-label="label"
      option-value="data"
      :disable="fabrics === void 0 || consoleStore.status(mainStore.world.id) !== 'Stop'"
      class="col"
      style="min-width: 8rem;"
    />
  </div>
</template>