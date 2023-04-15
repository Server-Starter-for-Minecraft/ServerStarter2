<script setup lang="ts">
import { ref } from 'vue';
import iconBtn from '../util/iconButton.vue'
import { World } from 'app/src-electron/api/scheme';
import { useRouter } from 'vue-router';

interface Props {
  world: World
}
const prop = defineProps<Props>()

const showRunBtn = ref(false)
const showEditBtns = ref(false)
</script>

<template>
<q-item
  clickable
  @mouseover="showEditBtns = true"
  @mouseleave="showEditBtns = false"
  class="worldBlock"
>
  <q-item-section
    avatar
    @mouseover="showRunBtn = true"
    @mouseleave="showRunBtn = false"
  >
    <q-avatar square size="60px">
      <q-img :src="world.settings.avater_path" :ratio="1"/>
      <q-btn
        v-show="showRunBtn"
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
  <q-item-section side v-show="showEditBtns">
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