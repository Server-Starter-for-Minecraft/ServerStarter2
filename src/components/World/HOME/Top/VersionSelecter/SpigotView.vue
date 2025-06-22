<script setup lang="ts">
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import {
  AllSpigotVersion,
  SpigotVersion,
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

function buildSpigotVer(ver: AllSpigotVersion[number]): SpigotVersion {
  return {
    id: ver.id,
    type: 'spigot' as const,
  };
}
/**
 * ワールドオブジェクトのバージョン情報を書き換える
 */
function updateWorldVersion(ver: AllSpigotVersion[number]) {
  if (mainStore.world?.version) {
    mainStore.world.version = buildSpigotVer(ver);
  }
}

/**
 * デフォルトバージョン（最新のバージョン）を取得する
 */
function getDefaultVersion() {
  return prop.versionData[0];
}

const spigotVer = computed({
  get: () => {
    const ver = mainStore.world?.version;
    if (!ver || ver.type === 'unknown') return getDefaultVersion();

    // 前のバージョンがSpigotに存在しないバージョンの時は，最新バージョンを割り当てる
    const findVer = prop.versionData.find((ops) => ops.id === ver.id);
    if (!findVer) return getDefaultVersion();

    return findVer;
  },
  set: (val) => {
    const newVer = buildSpigotVer(val);
    if (mainStore.worldBack?.version.type !== 'unknown') {
      openWarningDialog(
        $q,
        prop.versionData.map((ops) => ops.id),
        mainStore.worldBack?.version ?? newVer,
        newVer,
        'id'
      );
    }
  },
});

// 表示内容と内部データを整合させる
updateWorldVersion(spigotVer.value);
</script>

<template>
  <SsSelect
    v-model="spigotVer"
    :options="
      versionData.map((ver, idx) => {
        return {
          data: ver,
          label:
            idx === 0
              ? `${ver.id}【${$T('home.version.latestVersion')}】`
              : ver.id,
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
