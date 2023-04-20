<script setup lang="ts">
import { ref } from 'vue';
import { World, WorldSettings } from 'app/src-electron/api/scheme';
import worldVue from 'app/src/components/Main/WorldVue.vue';

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
const demoWorldList = [...Array(10)].map((_) => demoWorld)
/////////////////////////////////////////////////

const text = ref('');
const sortType = ref('名前');
const sortTypes = ['名前', '最終プレイ'];
const showWorldList = ref(demoWorldList)
</script>

<template>
  <q-item class="q-pa-md mainField" style="width: 100%;">
    <q-item-section>
      <div class="row">
        <q-btn color="primary" to="new-world" style="font-size: 2.5vmin;">新規作成</q-btn>
      
        <q-input
          v-model="text"
          clearable
          label="検索"
          @keyup="showWorldList = demoWorldList.filter(world => world.name.match(text))"
          @clear="showWorldList = demoWorldList"
          class="q-px-md"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>
    </q-item-section>

    <q-item-section side>
      <q-select
        v-model="sortType"
        :options="sortTypes"
        label="並び替え"
        style="width: 150px"
      />
    </q-item-section>
  </q-item>

  <q-separator class="q-mx-md"/>
  
  <q-virtual-scroll
    :items="showWorldList"
    separator
    v-slot="{ item, index }"
    class="q-pa-sm mainField fit"
    :items-size="500"
    style="flex: 1 1 0"
  >
    <world-vue :world="item" :idx="index" />
  </q-virtual-scroll>
  <div v-show="showWorldList.length == 0" class="col row justify-center items-center">
    <p class="q-pa-none">おや？ お探しのワールドは存在しないようです</p>
  </div>
</template>