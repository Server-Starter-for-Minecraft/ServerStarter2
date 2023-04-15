<script setup lang="ts">
import { ref } from 'vue';
import iconBtn from '../util/iconButton.vue'
import { World } from 'app/src-electron/api/scheme';
import { useRouter } from 'vue-router';
import { mainStore } from 'src/stores/MainStore';

interface Props {
  world: World
  idx: number
}
const prop = defineProps<Props>()


const router = useRouter();
const goProgress = async () => {
  await router.push('progress');
};
async function runServer() {
  goProgress();
  await window.API.runServer(JSON.stringify(prop.world));
}

const clicked = ref(false)
const itemHovered = ref(false)
const runBtnHovered = ref(false)
</script>

<template>
<q-item
  clickable
  :active="clicked = mainStore().selectedIdx == prop.idx"
  :focused="clicked = mainStore().selectedIdx == prop.idx"
  @click="mainStore().selectedIdx = idx"
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
    <q-avatar square size="60px">
      <q-img :src="world.settings.avater_path" :ratio="1"/>
      <q-btn
        v-show="clicked || runBtnHovered"
        @click="runServer"
        flat
        dense
        size="30px"
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
      <icon-btn icon="edit" text="ワールド編集"/>
      <icon-btn icon="folder_open" text="データを開く"/>
      <icon-btn icon="delete" text="削除"/>
    </div>
  </q-item-section>
</q-item>
</template>

<style scoped lang="scss">
.worldBlock {
  height: 80px;
}

.worldName {
  font-size: 20pt;
  font-weight: bold;
  margin: 0;
}

.versionName {
  margin-bottom: 4px;
}

.hantoumei {
  background-color: rgba($color: $primary, $alpha: 0.7);
}
</style>