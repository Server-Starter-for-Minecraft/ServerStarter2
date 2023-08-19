<script setup lang="ts">
import { ref } from 'vue';
import { AllVanillaVersion } from 'app/src-electron/schema/version';
import { useSystemStore } from 'src/stores/SystemStore';
import { useMainStore } from 'src/stores/MainStore';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import SsSelect from 'src/components/util/base/ssSelect.vue';

const sysStore = useSystemStore()
const mainStore = useMainStore()
const consoleStore = useConsoleStore()

const isRelease = ref(false)
const vanillas = sysStore.serverVersions.get('vanilla') as AllVanillaVersion | undefined
const vanillaOps = vanillas?.map(
  ver => { return { id: ver.id, type: 'vanilla' as const, release: ver.release }}
)

// vanillaでないときには最新のバージョンを割り当てる
if (mainStore.world.version.type !== 'vanilla' && vanillaOps !== void 0) {
  mainStore.world.version = vanillaOps[0]
}
</script>

<template>
  <div class="row justify-between q-gutter-md items-center">
    <SsSelect
      v-model="mainStore.world.version"
      :options="vanillaOps?.filter(ver => !isRelease || ver['release'])"
      :label="$t('home.version.versionType')"
      option-label="id"
      :disable="vanillas === void 0 || consoleStore.status(mainStore.world.id) !== 'Stop'"
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