<script setup lang="ts">
import { ref } from 'vue';
import { AllMohistmcVersion } from 'app/src-electron/schema/version';
import { useMainStore } from 'src/stores/MainStore';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import SsSelect from 'src/components/util/base/ssSelect.vue';

interface Prop {
  versionData: AllMohistmcVersion
}
const prop = defineProps<Prop>()

const mainStore = useMainStore()
const consoleStore = useConsoleStore()

const mohistVers = prop.versionData.map(ver => ver.id)
const mohistVer = ref(mohistVers[0])

const mohistBuilds = () => {
  return prop.versionData.find(ver => ver.id === mohistVer.value)?.builds
}
const mohistBuild = ref(prop.versionData[0].builds[0])

// mohistでないときには最新のバージョンを割り当てる
if (mainStore.world.version.type !== 'mohistmc') {
  onUpdatedSelection(false)
}
else {
  mohistVer.value = mainStore.world.version.id
  mohistBuild.value = {
    number: mainStore.world.version.number,
    forge_version: mainStore.world.version.forge_version
  }
}

/**
 * 描画する際にForgeの対応番号を記載する
 */
function getNumberName(n: number, forgeVersion?: string) {
  if (forgeVersion !== void 0) {
    return `${n} (Forge: ${forgeVersion})`
  }
  else {
    return n
  }
}

/**
 * バージョンやビルド番号が更新されたら、選択ワールドの情報を更新する
 * 
 * バージョンの変更に伴うビルド番号の更新はupdateBuildをTrueにする
 */
function onUpdatedSelection(updateBuild: boolean) {
  // バージョンに応じてビルド番号を更新
  if (updateBuild) {
    mohistBuild.value = 
      prop.versionData.find(v => v.id === mohistVer.value)?.builds[0]
      ?? mohistBuilds()?.[0]
      ?? { number: 0 }
  }

  mainStore.world.version = {
    id: mohistVer.value,
    type: 'mohistmc' as const,
    number: mohistBuild.value.number,
    forge_version: mohistBuild.value.forge_version
  }
}
</script>

<template>
  <div class="row justify-between q-gutter-md">
    <SsSelect
      v-model="mohistVer"
      @update:model-value="onUpdatedSelection(true)"
      :options="mohistVers.map(
        (ver, idx) => { return {
          data: ver,
          label: idx === 0 ? `${ver}【${$t('home.version.latestVersion')}】` : ver
        }}
      )"
      :label="$t('home.version.versionType')"
      option-label="label"
      option-value="data"
      :disable="consoleStore.status(mainStore.world.id) !== 'Stop'"
      class="col"
      style="min-width: 10rem;"
    />
    <SsSelect
      v-model="mohistBuild"
      @update:model-value="onUpdatedSelection(false)"
      :options="mohistBuilds()?.map((val, idx) => {
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
      :disable="consoleStore.status(mainStore.world.id) !== 'Stop'"
      class="col"
      style="min-width: 10rem;"
    />
  </div>
</template>