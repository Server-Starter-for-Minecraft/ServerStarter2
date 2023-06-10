<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useMainStore } from 'src/stores/MainStore';
import { runServer, useConsoleStore } from 'src/stores/ConsoleStore';
import { WorldEdited } from 'app/src-electron/schema/world';

interface Props {
  world: WorldEdited;
  idx: number;
}
const prop = defineProps<Props>();

const mainStore = useMainStore();
const consoleStore = useConsoleStore()

const router = useRouter()
async function startServer() {
  // 選択されているワールドを更新
  selectWorldIdx()

  // Stop状態のでない時にはサーバーを起動できないようにする
  if (consoleStore.status()!=='Stop') { return }

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
  mainStore.selectedIdx = prop.idx
  consoleStore.initTab()
}
</script>

<template>
  <q-item
    clickable
    :active="(clicked = mainStore.selectedIdx == idx)"
    :focused="(clicked = mainStore.selectedIdx == idx)"
    @click="selectWorldIdx"
    v-on:dblclick="startServer"
    @mouseover="itemHovered = true"
    @mouseleave="itemHovered = false"
    class="worldBlock"
  >
    <q-item-section
      avatar
      @mouseover="runBtnHovered = true"
      @mouseleave="runBtnHovered = false"
    >
      <q-avatar square size="4rem">
        <q-img
          :src="world.avater_path ?? 'src/assets/defaultWorldIcon.svg'"
          :ratio="1"
        />
        <q-btn
          v-show="consoleStore.status(world.id)==='Stop' && (clicked || runBtnHovered)"
          @click="startServer"
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
