<script setup lang="ts">
import { ref, toRaw } from 'vue';
import { useRouter } from 'vue-router';
import { useSystemStore } from 'src/stores/SystemStore';
import { useMainStore } from 'src/stores/MainStore';
import { runServer, useConsoleStore } from 'src/stores/ConsoleStore';
import { WorldEdited } from 'app/src-electron/schema/world';
import { assets } from 'src/assets/assets';

interface Props {
  world: WorldEdited;
}
const prop = defineProps<Props>();

const sysStore = useSystemStore();
const mainStore = useMainStore();
const consoleStore = useConsoleStore()

const router = useRouter()
async function startServer(mStore: typeof mainStore, cStore: typeof consoleStore) {
  // エラーを含むワールドの場合は実行しない
  if (mStore.errorWorlds.has(prop.world.id)) { return }

  // 選択されているワールドを更新
  selectWorldIdx()

  // Stop状態でない時にはサーバーを起動できないようにする
  if (cStore.status() !== 'Stop') { return }

  // NewWorldの場合にはWorldの書き出し、NewWorldではなくなる通知、を行う
  await window.API.invokeCreateWorld(toRaw(mStore.world))
  mStore.newWorlds.splice(mStore.newWorlds.indexOf(mStore.selectedWorldID), 1)

  // サーバーの起動を開始
  await router.push('/console');
  runServer()
}

const clicked = ref(false);
const itemHovered = ref(false);
const runBtnHovered = ref(false);

const versionName = `${prop.world.version.id} (${prop.world.version.type})`

/**
 * ワールドを選択した際に行うワールド関連の初期化
 */
function selectWorldIdx() {
  mainStore.setWorld(prop.world)
  consoleStore.initTab()
}
</script>

<template>
  <q-item
    clickable
    :active="(clicked = mainStore.selectedWorldID === world.id && $router.currentRoute.value.path.slice(0, 7) !== '/system')"
    :focused="(clicked = mainStore.selectedWorldID === world.id && $router.currentRoute.value.path.slice(0, 7) !== '/system')"
    @click="selectWorldIdx"
    to="/"
    v-on:dblclick="startServer"
    @mouseover="itemHovered = true"
    @mouseleave="itemHovered = false"
    class="worldBlock"
    :style="{'border-left': mainStore.selectedWorldID === world.id && $router.currentRoute.value.path.slice(0, 7) !== '/system' ? '.3rem solid #7CBB00' : '.3rem solid transparent'}"
  >
    <q-item-section
      avatar
      @mouseover="runBtnHovered = true"
      @mouseleave="runBtnHovered = false"
    >
      <q-avatar square size="4rem">
        <q-img
          :src="world.avater_path ?? assets.svg.defaultWorldIcon"
          :ratio="1"
          style="image-rendering: pixelated;"
        />
        <q-btn
          v-show="!mainStore.errorWorlds.has(world.id) && consoleStore.status(world.id)==='Stop' && runBtnHovered && sysStore.systemSettings().user.drawerWidth > 200"
          @click="() => startServer(mainStore, consoleStore)"
          flat
          dense
          size="2rem"
          icon="play_arrow"
          text-color="white"
          class="absolute-center q-mini-drawer-hide hantoumei"
        />
      </q-avatar>
    </q-item-section>
    <q-item-section>
      <div>
        <p class="worldName">{{ world.name }}</p>
        <p class="versionName">{{ versionName }}</p>
      </div>
    </q-item-section>
  </q-item>
</template>

<style scoped lang="scss">
.worldBlock {
  height: 5.5rem;
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

.hantoumei {
  background-color: rgba($color: $primary, $alpha: 0.7);
}
</style>
