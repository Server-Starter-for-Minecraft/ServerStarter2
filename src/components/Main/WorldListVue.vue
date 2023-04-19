<script setup lang="ts">
import { World, WorldSettings } from 'app/src-electron/api/scheme';
import worldVue from 'app/src/components/Main/WorldVue.vue';
import { ref } from 'vue';

// import { ref } from 'vue';
import { useSystemStore } from 'src/stores/SystemStore';
import { useMainStore } from 'src/stores/MainStore';
import iconBtn from '../util/iconButton.vue';

const autoShutdown = ref(true);

const systemStore = useSystemStore();

useMainStore().setHeader('Server Starter for Minecraft', {
  sideText: `ver ${systemStore.systemVersion}`,
});


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
  <div class="column" style="height: calc(100vh - 80px);">

    
    <q-item class="col-auto q-pa-md row expandHeader">
      <q-item-section>
        <p class="q-pl-md q-pt-lg">IP. {{ systemStore.publicIP }}</p>
        <q-checkbox v-model="autoShutdown" class="checkbox"
          >サーバー終了後にPCを自動シャットダウンする</q-checkbox
        >
      </q-item-section>
      <q-item-section side>
        <icon-btn icon="tune" size="16pt" text="詳細設定" to="settings" />
      </q-item-section>
    </q-item>

    <div class="row col-auto q-ma-md">
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
      style="width: 100%;"
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
