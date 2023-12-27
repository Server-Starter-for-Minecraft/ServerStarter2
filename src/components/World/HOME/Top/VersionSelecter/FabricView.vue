<script setup lang="ts">
import { ref } from 'vue';
import { AllFabricVersion, FabricVersion } from 'app/src-electron/schema/version';
import { useMainStore } from 'src/stores/MainStore';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import SsSelect from 'src/components/util/base/ssSelect.vue';

interface Prop {
  versionData: AllFabricVersion
}
const prop = defineProps<Prop>()

const mainStore = useMainStore()
const consoleStore = useConsoleStore()

const isRelease = ref(true)
const latestReleaseVer = () => { return prop.versionData.games.find(ops => ops.release) }
const fabricVer = ref(latestReleaseVer() ?? prop.versionData.games[0])

const fabricInstaller = ref(prop.versionData.installers[0])
const fabricLoader = ref(prop.versionData.loaders[0])

// fabricでないときには最新のバージョンを割り当てる
if (mainStore.world.version.type !== 'fabric') {
  onUpdatedSelection()
}
else {
  fabricVer.value = {
    id: mainStore.world.version.id,
    release: mainStore.world.version.release
  }
  fabricInstaller.value = mainStore.world.version.installer
  fabricLoader.value    = mainStore.world.version.loader
}

/**
 * バージョンやビルド番号が更新されたら、選択ワールドの情報を更新する
 */
function onUpdatedSelection() {
  mainStore.world.version = {
    id: fabricVer.value.id,
    release: fabricVer.value.release,
    type: 'fabric' as const,
    loader: fabricLoader.value,
    installer: fabricInstaller.value
  }
}
</script>

<template>
  <div class="row justify-between q-gutter-md q-pb-md items-center">
    <SsSelect
      v-model="fabricVer"
      @update:model-value="onUpdatedSelection()"
      :options="versionData.games.filter(
        (ver, idx) => !isRelease || idx == 0 || ver.release
      ).map(
        (ver, idx) => { return {
          data: ver,
          label: ver.id === latestReleaseVer()?.id ? `${ver.id}【${$t('home.version.latestRelease')}】` : idx === 0 ? `${ver.id}【${$t('home.version.latestSnapshot')}】` : ver.id
        }}
      )"
      :label="$t('home.version.versionType')"
      option-label="label"
      option-value="data"
      :disable="consoleStore.status(mainStore.world.id) !== 'Stop'"
      class="col"
      style="min-width: 8rem;"
    />
    <q-toggle
      v-model="isRelease"
      :label="isRelease ? $t('home.version.onlyReleased') : $t('home.version.allVersions')"
      left-label
      :disable="consoleStore.status(mainStore.world.id) !== 'Stop'"
      style="width: fit-content;"
    />
  </div>

  <div class="row justify-between q-gutter-md">
    <SsSelect
      v-model="fabricInstaller"
      @update:modelValue="(newVal: string) => {
        (mainStore.world.version as FabricVersion).installer = newVal
        onUpdatedSelection()
      }"
      :options="prop.versionData.installers.map(
        (installer, i) => { return { data: installer, label: i === 0 ? `${installer} (${$t('home.version.recommend')})` : installer }}
      )"
      :label="$t('home.version.installer')"
      option-label="label"
      option-value="data"
      :disable="consoleStore.status(mainStore.world.id) !== 'Stop'"
      class="col"
      style="min-width: 10rem;"
    />
    <SsSelect
      v-model="fabricLoader"
      @update:modelValue="(newVal: string) => {
        (mainStore.world.version as FabricVersion).loader = newVal
        onUpdatedSelection()
      }"
      :options="prop.versionData.loaders.map(
        (loader, i) => { return { data: loader, label: i === 0 ? `${loader} (${$t('home.version.recommend')})` : loader }}
      )"
      :label="$t('home.version.loader')"
      option-label="label"
      option-value="data"
      :disable="consoleStore.status(mainStore.world.id) !== 'Stop'"
      class="col"
      style="min-width: 10rem;"
    />
  </div>
</template>