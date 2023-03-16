<script setup lang="ts">
import { ref } from 'vue';
import iconBtn from '../util/iconButton.vue'

defineProps(['avater', 'version', 'worldName'])

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
      <q-img :src="avater" :ratio="1"/>
      <q-btn
        v-show="showRunBtn"
        flat
        dense
        size="30px"
        icon="play_arrow"
        text-color="red"
        class="absolute-center hantoumei"
      />
    </q-avatar>
  </q-item-section>
  <q-item-section>
    <div>
      <p class="worldName">{{ worldName }}</p>
      <p class="versionName">{{ version }}</p>
    </div>
  </q-item-section>
  <q-item-section side v-show="showEditBtns">
    <div class="row">
      <icon-btn icon="edit" text="ワールド編集" color="red"/>
      <icon-btn icon="folder_open" text="データを開く" color="red"/>
      <icon-btn icon="delete" text="削除" color="red"/>
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
  background-color: rgba($color: white, $alpha: 0.7);
}
</style>