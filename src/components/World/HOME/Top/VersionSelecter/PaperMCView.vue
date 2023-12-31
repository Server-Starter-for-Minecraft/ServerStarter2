<script setup lang="ts">
import { ref } from 'vue';
import { AllPapermcVersion } from 'app/src-electron/schema/version';
import { useMainStore } from 'src/stores/MainStore';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import SsSelect from 'src/components/util/base/ssSelect.vue';

interface Prop {
  versionData: AllPapermcVersion
}
const prop = defineProps<Prop>()

const mainStore = useMainStore()
const consoleStore = useConsoleStore()

const paperVers = () => { return prop.versionData.map(ver => ver.id) }
const paperVer = ref(paperVers()[0])

const paperBuilds = () => {
  return prop.versionData.find(ver => ver.id === paperVer.value)?.builds
}
const paperBuild = ref(prop.versionData[0].builds[0])

// paperでないときには最新のバージョンを割り当てる
if (mainStore.world.version.type !== 'papermc') {
  onUpdatedSelection(false)
}
else {
  paperVer.value   = mainStore.world.version.id
  paperBuild.value = mainStore.world.version.build
}

/**
 * バージョンやビルド番号が更新されたら、選択ワールドの情報を更新する
 * 
 * バージョンの変更に伴うビルド番号の更新はupdateBuildをTrueにする
 */
function onUpdatedSelection(updateBuild: boolean) {
  // バージョンに応じてビルド番号を更新
  if (updateBuild) {
    paperBuild.value = paperBuilds()?.[0] ?? 0
  }

  mainStore.world.version = {
    id: paperVer.value,
    type: 'papermc' as const,
    build: paperBuild.value
  }
}
</script>

<template>
  <div class="row justify-between q-gutter-md">
    <SsSelect
      v-model="paperVer"
      @update:model-value="onUpdatedSelection(true)"
      :options="paperVers().map(
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
      v-model="paperBuild"
      @update:model-value="onUpdatedSelection(false)"
      :options="paperBuilds()?.map((build, idx) => {
        return {
          data: build,
          label: idx === 0
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