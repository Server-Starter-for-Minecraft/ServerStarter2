<script setup lang="ts">
import { ref } from 'vue';
import { AllVanillaVersion } from 'app/src-electron/schema/version';
import { useMainStore } from 'src/stores/MainStore';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import SsSelect from 'src/components/util/base/ssSelect.vue';

interface Prop {
  versionData: AllVanillaVersion
}
const prop = defineProps<Prop>()

const mainStore = useMainStore()
const consoleStore = useConsoleStore()

const isRelease = ref(true)
const vanillaOps = prop.versionData.map(
  ver => { return { id: ver.id, type: 'vanilla' as const, release: ver.release }}
)
const latestReleaseID = vanillaOps?.find(ops => ops.release)?.id

// vanillaでないときには最新のバージョンを割り当てる
if (mainStore.world.version.type !== 'vanilla' && vanillaOps !== void 0) {
  mainStore.world.version = vanillaOps.find(ops => ops.release) ?? vanillaOps[0]
}
</script>

<template>
  <div class="row justify-between q-gutter-md items-center">
    <SsSelect
      v-model="mainStore.world.version"
      :options="vanillaOps?.filter(
        (ver, idx) => !isRelease || idx == 0 || ver['release']
      ).map(
        (ver, idx) => { return {
          data: ver,
          label: ver.id === latestReleaseID ? `${ver.id}【${$t('home.version.latestRelease')}】` : idx === 0 ? `${ver.id}【${$t('home.version.latestSnapshot')}】` : ver.id
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
</template>