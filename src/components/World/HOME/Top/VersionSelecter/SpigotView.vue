<script setup lang="ts">
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import {
  AllSpigotVersion,
  SpigotVersion,
  VersionId,
} from 'app/src-electron/schema/version';
import { $T } from 'src/i18n/utils/tFunc';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';
import SsSelect from 'src/components/util/base/ssSelect.vue';
import { openWarningDialog } from './versionComparator';

interface Prop {
  versionData: AllSpigotVersion;
}
const prop = defineProps<Prop>();

const $q = useQuasar();
const mainStore = useMainStore();
const consoleStore = useConsoleStore();

function buildSpigotVer(id: VersionId): SpigotVersion {
  return {
    id: id,
    type: 'spigot' as const,
  };
}
/**
 * ワールドオブジェクトのバージョン情報を書き換える
 */
function updateWorldVersion(id: VersionId) {
  if (mainStore.world?.version) {
    mainStore.world.version = buildSpigotVer(id);
  }
}

const spigotVers = () => {
  return prop.versionData.map((ver) => ver.id);
};
const spigotVer = computed({
  get: () => {
    const ver = mainStore.world?.version;
    if (!ver || ver.type === 'unknown') return '';
    // 前のバージョンがSpigotに存在しないバージョンの時は，最新バージョンを割り当てる
    if (spigotVers().indexOf(ver.id ?? '') === -1) {
      return spigotVers()[0];
    }
    return ver.id ?? '';
  },
  set: (val) => {
    if (val === '') return;
    const newVer = buildSpigotVer(val);
    if (mainStore.worldBack?.version.type !== 'unknown') {
      openWarningDialog(
        $q,
        spigotVers(),
        mainStore.worldBack?.version ?? newVer,
        newVer,
        'id'
      );
    }
  },
});

// 表示内容と内部データを整合させる
if (spigotVer.value !== '') {
  updateWorldVersion(spigotVer.value);
}
</script>

<template>
  <SsSelect
    v-model="spigotVer"
    :options="
      spigotVers().map((ver, idx) => {
        return {
          data: ver,
          label:
            idx === 0 ? `${ver}【${$T('home.version.latestVersion')}】` : ver,
        };
      })
    "
    :label="$T('home.version.versionType')"
    option-label="label"
    option-value="data"
    :disable="consoleStore.status(mainStore.selectedWorldID) !== 'Stop'"
    class="col"
  />
</template>
