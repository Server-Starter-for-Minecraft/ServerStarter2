<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { getCssVar } from 'quasar';
import { useSystemStore } from 'src/stores/SystemStore';
import { useMainStore } from 'src/stores/MainStore';
import { runServer, useConsoleStore } from 'src/stores/ConsoleStore';
import { WorldEdited } from 'app/src-electron/schema/world';
import { assets } from 'src/assets/assets';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';
import { $T } from 'src/i18n/utils/tFunc';

interface Props {
  world: WorldEdited;
}
const prop = defineProps<Props>();

const sysStore = useSystemStore();
const mainStore = useMainStore();
const consoleStore = useConsoleStore();

const router = useRouter();
async function startServer(
  mStore: typeof mainStore,
  cStore: typeof consoleStore
) {
  // エラーを含むワールドの場合は実行しない
  if (mStore.errorWorlds.has(prop.world.id)) {
    return;
  }

  // 選択されているワールドを更新
  selectWorldIdx();

  // Stop状態でない時にはサーバーを起動できないようにする
  if (cStore.status(prop.world.id) !== 'Stop') {
    return;
  }

  // サーバーの起動を開始
  await router.push('/console');
  runServer();
}

const clicked = ref(false);
const itemHovered = ref(false);
const runBtnHovered = ref(false);

/**
 * ワールドを選択した際に行うワールド関連の初期化
 */
function selectWorldIdx() {
  mainStore.setWorld(prop.world);
  consoleStore.initTab(prop.world.id);
}

const tooltipText = computed(() => {
  return `${prop.world.name}<br />
          ${
            prop.world.version.type === 'vanilla'
              ? prop.world.version.id
              : `${prop.world.version.id} (${$T(
                  `home.serverType.${prop.world.version.type}`
                )})`
          }`;
});
</script>

<template>
  <q-item
    clickable
    :active="
      (clicked =
        mainStore.selectedWorldID === world.id &&
        $route.path.slice(0, 7) !== '/system')
    "
    :focused="
      (clicked =
        mainStore.selectedWorldID === world.id &&
        $route.path.slice(0, 7) !== '/system')
    "
    @click="selectWorldIdx"
    v-on:dblclick="() => startServer(mainStore, consoleStore)"
    :to="$route.path.slice(0, 7) === '/system' ? '/' : $route"
    @mouseover="itemHovered = true"
    @mouseleave="itemHovered = false"
    class="worldBlock"
    :style="{
      'border-left':
        mainStore.selectedWorldID === world.id &&
        $route.path.slice(0, 7) !== '/system'
          ? `.3rem solid ${getCssVar('primary')}`
          : '.3rem solid transparent',
      'max-width': `${sysStore.systemSettings.user.drawerWidth}px`,
    }"
  >
    <q-item-section
      avatar
      @mouseover="runBtnHovered = true"
      @mouseleave="runBtnHovered = false"
    >
      <q-avatar square size="4.5rem">
        <q-img
          :src="world.avater_path ?? assets.png.unset"
          :ratio="1"
          style="image-rendering: pixelated"
        />
        <q-btn
          v-show="
            !mainStore.errorWorlds.has(world.id) &&
            consoleStore.status(world.id) === 'Stop' &&
            runBtnHovered &&
            sysStore.systemSettings.user.drawerWidth > 200
          "
          @click="() => startServer(mainStore, consoleStore)"
          flat
          dense
          size="2rem"
          icon="play_arrow"
          text-color="white"
          class="absolute-center q-mini-drawer-hide bg-primary"
          style="opacity: 0.7"
        />
        <div
          v-show="consoleStore.status(world.id) !== 'Stop'"
          class="absolute-top-right badge"
        >
          <q-badge
            outline
            rounded
            style="background-color: #262626; aspect-ratio: 1"
          >
            <q-icon
              v-if="consoleStore.status(world.id) === 'CheckLog'"
              name="notes"
              size="1rem"
            />
            <q-icon
              v-else
              :name="
                assets.svg.systemLogo_filled(
                  getCssVar('primary')?.replace('#', '%23')
                )
              "
              size="1rem"
            />
          </q-badge>
        </div>
      </q-avatar>
    </q-item-section>
    <q-item-section>
      <q-item-label class="worldName text-omit">{{ world.name }}</q-item-label>
      <q-item-label class="versionName">
        {{
          world.version.type === 'vanilla'
            ? world.version.id
            : `${world.version.id} (${$t(
                `home.serverType.${world.version.type}`
              )})`
        }}
      </q-item-label>
      <q-item-label v-if="world.last_date" class="date text-omit">
        {{
          $t('mainLayout.customMapImporter.lastPlayed', {
            datetime: $d(world.last_date, 'dateTime'),
          })
        }}
      </q-item-label>
    </q-item-section>
    <SsTooltip :name="tooltipText" anchor="center end" self="center start" />
  </q-item>
</template>

<style scoped lang="scss">
.worldBlock {
  height: 6.5rem;
}

.worldName {
  font-size: 2rem;
  font-weight: bold;
  margin: 0;
}

.versionName {
  font-size: 1rem;
  margin-bottom: 4px;
}

.date {
  font-size: 0.75rem;
  opacity: 0.6;
}

.badge {
  margin: -10px;
}
</style>
