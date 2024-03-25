<script setup lang="ts">
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import { AllSpigotVersion } from 'app/src-electron/schema/version';
import { useMainStore } from 'src/stores/MainStore';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { openWarningDialog } from './versionComparator';
import SsSelect from 'src/components/util/base/ssSelect.vue';

interface Prop {
  versionData: AllSpigotVersion;
}
const prop = defineProps<Prop>();

const $q = useQuasar();
const mainStore = useMainStore();
const consoleStore = useConsoleStore();

function buildSpigotVer(id: string) {
  return {
    id: id,
    type: 'spigot' as const,
  };
}

const spigotVers = () => {
  return prop.versionData.map((ver) => ver.id);
};
const spigotVer = computed({
  get: () => {
    // 前のバージョンがSpigotに存在しないバージョンの時は，最新バージョンを割り当てる
    if (spigotVers().indexOf(mainStore.world.version.id) === -1) {
      return spigotVers()[0];
    }
    return mainStore.world.version.id;
  },
  set: (val) => {
    const newVer = buildSpigotVer(val);
    openWarningDialog(
      $q,
      spigotVers(),
      mainStore.worldBack?.version ?? newVer,
      newVer,
      'id'
    );
  },
});

// 表示内容と内部データを整合させる
mainStore.world.version = buildSpigotVer(spigotVer.value);
</script>

<template>
  <SsSelect
    v-model="spigotVer"
    :options="
      spigotVers().map((ver, idx) => {
        return {
          data: ver,
          label:
            idx === 0 ? `${ver}【${$t('home.version.latestVersion')}】` : ver,
        };
      })
    "
    :label="$t('home.version.versionType')"
    option-label="label"
    option-value="data"
    :disable="consoleStore.status(mainStore.world.id) !== 'Stop'"
    class="col"
  />
</template>
