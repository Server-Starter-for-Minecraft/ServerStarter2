<script setup lang="ts">
import { World, WorldSettings } from 'app/src-electron/api/scheme';
import worldVue from 'app/src/components/Main/WorldVue.vue';
import { ref } from 'vue';

/////////////////// demoデータ ///////////////////
const demoWorldSettings: WorldSettings = {
  avater_path: 'https://cdn.quasar.dev/img/parallax2.jpg',
  version: { id: '1.19.2', type: 'vanilla', release: true },
};
const demoWorld: World = {
  name: 'testWorld',
  settings: demoWorldSettings,
  datapacks: [],
  plugins: [],
  mods: [],
};
/////////////////////////////////////////////////

const worldList = [...Array(10)].map((_) => demoWorld);
const showWorldList = ref(worldList);
const text = ref('');
const sortType = ref('名前');
const sortTypes = ['名前', '最終プレイ'];
</script>

<template>
  <div>
    <div class="row q-ma-md">
      <q-btn color="primary" to="new-world">新規作成</q-btn>
  
      <q-input
        v-model="text"
        clearable
        label="検索"
        @keyup="showWorldList = worldList.filter(world => world.name.match(text))"
        @clear="showWorldList = worldList"
        class="q-px-md"
      >
        <template v-slot:append>
          <q-icon name="search" />
        </template>
      </q-input>
  
      <q-space/>
  
      <q-select
        v-model="sortType"
        :options="sortTypes"
        label="並び替え"
        style="width: 150px"
      />
    </div>
  
    <q-separator/>
  
    <!-- TODO: scrollエリアとnotFoundエリアの高さ指定方法を改善 -->
    <!-- <div class="bg-red col" style="overflow: scroll;">
      <template v-for="text in Array(100)" :key="text">
        a<br/>
      </template>
    </div> -->
    <q-virtual-scroll
      :items="showWorldList"
      separator
      v-slot="{ item, index }"
      class="col q-pa-sm mainField"
      :items-size="500"
    >
      <world-vue :world="item" :idx="index" />
    </q-virtual-scroll>
  </div>

  <div v-show="showWorldList.length == 0" class="notFound">
    <p class="q-pa-none">おや？　お探しのワールドは存在しないようです</p>
  </div>
</template>

<style scoped lang="scss">
.notFound {
  height: 75%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
