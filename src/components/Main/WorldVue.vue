<script setup lang="ts">
import { ref, toRaw } from 'vue';
import { useRouter } from 'vue-router';
import { World } from 'app/src-electron/api/scheme';
import { useMainStore } from 'src/stores/MainStore';
import { useSystemStore } from 'src/stores/SystemStore';
import { useWorldEditStore } from 'src/stores/WorldEditStore';
import iconBtn from '../util/iconButton.vue';
import { checkError } from 'src/components/Error/Error';

interface Props {
  world: World;
  idx: number;
}
const prop = defineProps<Props>();

const mainStore = useMainStore();
const systemStore = useSystemStore();

const router = useRouter();
const goProgress = async () => {
  await router.replace('progress');
};
async function runServer() {
  await goProgress();
  mainStore.setHeader(prop.world.name, {
    subTitle: prop.world.settings.version.id,
    sideText: `IP. ${systemStore.publicIP}`,
  });

  // toRaw(proxy)とすることでvue上のProxyオブジェクトのtargetを抜き出せる
  const res = await window.API.invokeRunServer(toRaw(prop.world));

  checkError(res, console.log, 'サーバーが異常終了しました。')
}

const clicked = ref(false);
const itemHovered = ref(false);
const runBtnHovered = ref(false);

function worldEdit() {
  useWorldEditStore().worldIndex = prop.idx
  // TODO: deep copy のモジュールを作成？
  useWorldEditStore().world = JSON.parse(JSON.stringify(prop.world)) as World
}
</script>

<template>
  <q-item
    clickable
    :active="(clicked = mainStore.selectedIdx == prop.idx)"
    :focused="(clicked = mainStore.selectedIdx == prop.idx)"
    @click="mainStore.selectedIdx = idx"
    v-on:dblclick="runServer"
    @mouseover="itemHovered = true"
    @mouseleave="itemHovered = false"
    class="worldBlock"
  >
    <q-item-section
      avatar
      @mouseover="runBtnHovered = true"
      @mouseleave="runBtnHovered = false"
    >
      <q-avatar square size="9vmin">
        <q-img :src="world.settings.avater_path" :ratio="1" />
        <q-btn
          v-show="clicked || runBtnHovered"
          @click="runServer"
          flat
          dense
          size="4.5vmin"
          icon="play_arrow"
          text-color="white"
          class="absolute-center hantoumei"
        />
      </q-avatar>
    </q-item-section>
    <q-item-section>
      <div>
        <p class="worldName">{{ world.name }}</p>
        <p class="versionName">{{ world.settings.version.id }}</p>
      </div>
    </q-item-section>
    <q-item-section side v-show="clicked || itemHovered">
      <div class="row">
        <!-- TODO: 「データを開く」はワールド編集の中に入れて、「再構成」を表に出す？ -->
        <icon-btn icon="edit" text="ワールド編集" size="2vmin" to="world-edit" @click="worldEdit"/>
        <icon-btn icon="folder_open" text="データを開く" size="2vmin"/>
        <icon-btn icon="delete" text="削除" size="2vmin"/>
      </div>
    </q-item-section>
  </q-item>
</template>

<style scoped lang="scss">
.worldBlock {
  height: 12vmin;
}

.worldName {
  font-size: 4vmin;
  font-weight: bold;
  margin: 0;
}

.versionName {
  font-size: 2.5vmin;
  margin-bottom: 4px;
}

.hantoumei {
  background-color: rgba($color: $primary, $alpha: 0.7);
}
</style>
