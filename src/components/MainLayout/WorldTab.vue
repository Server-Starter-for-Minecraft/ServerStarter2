<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { getCssVar } from 'quasar';
import { assets } from 'src/assets/assets';
import { $T } from 'src/i18n/utils/tFunc';
import { runServer, useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';
import { useSystemStore } from 'src/stores/SystemStore';
import { WorldItem } from 'src/stores/WorldStore';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';

interface Props {
  world_item: WorldItem;
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
  if (mStore.errorWorlds.has(prop.world_item.world.id)) {
    return;
  }

  // Abbrは実行できない
  if (prop.world_item.type === 'abbr') {
    return;
  }

  // 選択されているワールドを更新
  selectWorldIdx();

  // Stop状態でない時にはサーバーを起動できないようにする
  if (cStore.status(prop.world_item.world.id) !== 'Stop') {
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
  mainStore.showWorld(prop.world_item.world);
  consoleStore.initTab(prop.world_item.world.id);
}

const tooltipText = () => {
  switch (prop.world_item.type) {
    case 'abbr':
      return prop.world_item.world.name;
    case 'edited':
      return `${prop.world_item.world.name}
              ${
                prop.world_item.world.version.type === 'vanilla'
                  ? prop.world_item.world.version.id
                  : `${prop.world_item.world.version.id} (${$T(
                      `home.serverType.${prop.world_item.world.version.type}`
                    )})`
              }`;
  }
};
</script>

<template>
  <q-item
    clickable
    :active="
      (clicked =
        mainStore.selectedWorldID === world_item.world.id &&
        $route.path.slice(0, 7) !== '/system')
    "
    :focused="
      (clicked =
        mainStore.selectedWorldID === world_item.world.id &&
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
        mainStore.selectedWorldID === world_item.world.id &&
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
        <!-- 正常に読み込めた場合はワールドアイコンを表示 -->
        <q-img
          v-if="world_item.type === 'edited'"
          :src="world_item.world.avater_path ?? assets.png.unset"
          :ratio="1"
          style="image-rendering: pixelated"
        />
        <!-- 読込中 -->
        <q-spinner
          v-else-if="!mainStore.errorWorlds.has(world_item.world.id)"
          color="primary"
        />
        <!-- 読込失敗 -->
        <q-icon v-else name="warning" color="negative" size="3.5rem" />
        
        <!-- 正常に読み込めた && 停止中 && ホバー中 の時にのみ実行ボタンを表示 -->
        <q-btn
          v-show="
            !mainStore.errorWorlds.has(world_item.world.id) &&
            consoleStore.status(world_item.world.id) === 'Stop' &&
            world_item.type === 'edited' &&
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
          v-show="consoleStore.status(world_item.world.id) !== 'Stop'"
          class="absolute-top-right badge"
        >
          <q-badge
            outline
            rounded
            style="background-color: #262626; aspect-ratio: 1"
          >
            <q-icon
              v-if="consoleStore.status(world_item.world.id) === 'CheckLog'"
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
      <q-item-label class="worldName text-omit">{{
        world_item.world.name
      }}</q-item-label>
      <q-item-label v-if="world_item.type === 'edited'" class="versionName">
        {{
          world_item.world.version.type === 'vanilla'
            ? world_item.world.version.id
            : `${world_item.world.version.id} (${$t(
                `home.serverType.${world_item.world.version.type}`
              )})`
        }}
      </q-item-label>
      <q-item-label
        v-if="world_item.type === 'edited' && world_item.world.last_date"
        class="date text-omit"
      >
        {{
          $t('mainLayout.customMapImporter.lastPlayed', {
            datetime: $d(world_item.world.last_date, 'dateTime'),
          })
        }}
      </q-item-label>
    </q-item-section>
    <SsTooltip :name="tooltipText()" anchor="center end" self="center start" />
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
