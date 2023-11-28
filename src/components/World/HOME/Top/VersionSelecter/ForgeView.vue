<script setup lang="ts">
import { ref } from 'vue';
import { AllForgeVersion } from 'app/src-electron/schema/version';
import { useMainStore } from 'src/stores/MainStore';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import SsSelect from 'src/components/util/base/ssSelect.vue';

interface Prop {
  versionData: AllForgeVersion
}
const prop = defineProps<Prop>()

const mainStore = useMainStore()
const consoleStore = useConsoleStore()

const forgeVerOps = prop.versionData.map(ver => ver.id)
const forgeVer = ref(prop.versionData[0].id)

const forgeBuilds = () => {
  return prop.versionData.find(ver => ver.id === forgeVer.value)?.forge_versions
}
const forgeBuilder = ref(prop.versionData[0].forge_versions[0])

/**
 * 推奨ビルド番号 or ビルド一覧の先頭を「(推奨)」として提示する
 */
const recommendBuildIdx = () => {
  const idxNumber = forgeBuilds()?.findIndex(
    build => prop.versionData.find(v => v.id === forgeVer.value)?.recommended === build
  )
  return idxNumber === -1 ? 0 : idxNumber
}

// forgeでないときには最新のバージョンを割り当てる
if (mainStore.world.version.type !== 'forge') {
  onUpdatedSelection(false)
}
else {
  forgeVer.value     = mainStore.world.version.id
  forgeBuilder.value = mainStore.world.version.forge_version
}

/**
 * バージョンやビルド番号が更新されたら、選択ワールドの情報を更新する
 * 
 * バージョンの変更に伴うビルド番号の更新はupdateBuildをTrueにする
 */
function onUpdatedSelection(updateBuild: boolean) {
  // バージョンに応じてビルド番号を更新
  if (updateBuild) {
    forgeBuilder.value = prop.versionData.find(v => v.id === forgeVer.value)?.recommended ?? forgeBuilds()?.[0] ?? ''
  }

  mainStore.world.version = {
    id: forgeVer.value,
    type: 'forge' as const,
    forge_version: forgeBuilder.value
  }
}
</script>

<template>
  <div class="row justify-between q-gutter-md">
    <SsSelect
      v-model="forgeVer"
      @update:model-value="onUpdatedSelection(true)"
      :options="forgeVerOps?.map(
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
      v-model="forgeBuilder"
      @update:model-value="onUpdatedSelection(false)"
      :options="forgeBuilds()?.map((build, idx) => {
        return {
          data: build,
          label: recommendBuildIdx() === idx
            ? `${build} (${$t('home.version.recommend')})`
            : build
        }
      })"
      :label="$t('home.version.buildNumber')"
      option-label="label"
      option-value="data"
      :disable="consoleStore.status(mainStore.world.id) !== 'Stop'"
      class="col"
      style="min-width: 10rem;"
    />
  </div>
</template>