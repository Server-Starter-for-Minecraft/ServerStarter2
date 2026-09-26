<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { getCssVar } from 'quasar';
import { Version } from 'app/src-electron/schema/version';
import { assets } from 'src/assets/assets';
import { $T } from 'src/i18n/utils/tFunc';
import { runServer, useConsoleStore } from 'src/stores/ConsoleStore';
import { useErrorWorldStore } from 'src/stores/ErrorWorldStore';
import { useMainStore } from 'src/stores/MainStore';
import { useSystemStore } from 'src/stores/SystemStore';
import { WorldItem } from 'src/stores/WorldStore';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';

interface Props {
  worldItem: WorldItem;
}
const prop = defineProps<Props>();

const sysStore = useSystemStore();
const mainStore = useMainStore();
const errorWorldStore = useErrorWorldStore();
const consoleStore = useConsoleStore();

const router = useRouter();
async function startServer(
  eStore: typeof errorWorldStore,
  cStore: typeof consoleStore
) {
  // エラーを含むワールドの場合は実行しない
  if (eStore.isError(prop.worldItem.world.id)) return;

  // Abbrは実行できない
  if (prop.worldItem.type === 'abbr') return;

  // 選択されているワールドを更新
  selectWorldIdx();

  // Stop状態でない時にはサーバーを起動できないようにする
  if (cStore.status(prop.worldItem.world.id) !== 'Stop') return;

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
  mainStore.showWorld(prop.worldItem.world);
  consoleStore.initTab(prop.worldItem.world.id);
}

/** バージョンの表示名を定義 */
const showingVersion = (v: Version) => {
  if (v.type === 'unknown') return '';
  else if (v.type === 'vanilla') return v.id;
  else return `${v.id} (${$T(`home.serverType.${v.type}`)})`;
};

/** Tooltipの表示方法を定義 */
const tooltipText = (w: WorldItem) => {
  switch (w.type) {
    case 'abbr':
      return w.world.name;
    case 'edited':
      return `${w.world.name}\n${showingVersion(w.world.version)}`;
  }
};
</script>

<template>
  <q-item
    clickable
    :active="
      (clicked =
        mainStore.selectedWorldID === worldItem.world.id &&
        $route.path.slice(0, 7) !== '/system')
    "
    :focused="
      (clicked =
        mainStore.selectedWorldID === worldItem.world.id &&
        $route.path.slice(0, 7) !== '/system')
    "
    @click="selectWorldIdx"
    v-on:dblclick="() => startServer(errorWorldStore, consoleStore)"
    :to="$route.path.slice(0, 7) === '/system' ? '/' : $route"
    @mouseover="itemHovered = true"
    @mouseleave="itemHovered = false"
    class="worldBlock"
    :style="{
      'border-left':
        mainStore.selectedWorldID === worldItem.world.id &&
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
          v-if="worldItem.type === 'edited'"
          :src="worldItem.world.avater_path ?? assets.png.unset"
          :ratio="1"
          style="image-rendering: pixelated"
        />
        <!-- 読込中 -->
        <q-spinner
          v-else-if="!errorWorldStore.isError(worldItem.world.id)"
          color="primary"
        />
        <!-- 読込失敗 -->
        <q-icon
          v-else
          name="warning"
          color="negative"
          size="3rem"
          style="border: 3px solid; padding: 10px"
        />

        <!-- 正常に読み込めた && 停止中 && ホバー中 の時にのみ実行ボタンを表示 -->
        <q-btn
          v-show="
            !errorWorldStore.isError(worldItem.world.id) &&
            consoleStore.status(worldItem.world.id) === 'Stop' &&
            worldItem.type === 'edited' &&
            runBtnHovered &&
            sysStore.systemSettings.user.drawerWidth > 200
          "
          @click="() => startServer(errorWorldStore, consoleStore)"
          flat
          dense
          size="2rem"
          icon="play_arrow"
          text-color="white"
          class="absolute-center q-mini-drawer-hide bg-primary"
          style="opacity: 0.7"
        />
        <div
          v-show="consoleStore.status(worldItem.world.id) !== 'Stop'"
          class="absolute-top-right badge"
        >
          <q-badge
            outline
            rounded
            style="background-color: #262626; aspect-ratio: 1"
          >
            <q-icon
              v-if="consoleStore.status(worldItem.world.id) === 'CheckLog'"
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
      <q-item-label class="worldName text-omit">
        {{ worldItem.world.name }}
      </q-item-label>
      <q-item-label v-if="worldItem.type === 'edited'" class="versionName">
        {{ showingVersion(worldItem.world.version) }}
      </q-item-label>
      <q-item-label
        v-if="worldItem.type === 'edited' && worldItem.world.last_date"
        class="date text-omit"
      >
        {{
          $t('mainLayout.customMapImporter.lastPlayed', {
            datetime: $d(worldItem.world.last_date, 'dateTime'),
          })
        }}
      </q-item-label>
    </q-item-section>
    <SsTooltip
      :name="tooltipText(worldItem)"
      anchor="center end"
      self="center start"
    />
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
