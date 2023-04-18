<script setup lang="ts">
import { World, WorldSettings } from 'app/src-electron/api/scheme';
import worldVue from 'app/src/components/Main/WorldVue.vue';
import { ref } from 'vue';

/////////////////// demoデータ ///////////////////
const demoWorldSettings:WorldSettings = {
  avater_path: 'https://cdn.quasar.dev/img/parallax2.jpg',
  version: {id: '1.0.0', type: 'vanilla', release: true}
}
const demoWorld:World = {
  name: 'testWorld',
  settings: demoWorldSettings
}
/////////////////////////////////////////////////

const worldList = [...Array(10)].map(_ => demoWorld)
const showWorldList = ref(worldList)
const text  = ref('')
const sortType = ref('名前')
const sortTypes = ['名前', '最終プレイ']

function search(searchName:string) {
  showWorldList.value = worldList.filter(world => world.name.match(`${searchName}`))
}

function cursorClicked() {
  text.value = ''
  showWorldList.value = worldList
}
</script>

<template>
  <q-item class="q-pa-md list">
    <q-item-section>
      <div class="row">
        <q-btn color="primary" to="new-world">新規作成</q-btn>

        <q-input
          v-model="text"
          label="検索"
          v-on:keyup="search(text)"
          class="q-px-md"
        >
          <template v-slot:append>
            <q-icon v-if="text !== ''" name="close" @click="cursorClicked" class="cursor-pointer" />
            <q-icon name="search"/>
          </template>
        </q-input>

      </div>
    </q-item-section>
    
    <q-item-section side>
      <q-select
        v-model="sortType"
        :options="sortTypes"
        label="並び替え"
        style="width: 150px;"
      />
    </q-item-section>
  </q-item>

  <q-separator class="q-ma-md"/>

  <!-- TODO: scrollエリアとnotFoundエリアの高さ指定方法を改善 -->
  <q-virtual-scroll
    style="max-height: 85%;"
    :items="showWorldList"
    separator
    v-slot="{ item, index }"
    class="q-pa-sm list"
  >
    <world-vue :world="item" :idx="index"/>
  </q-virtual-scroll>

  <div v-show="showWorldList.length==0" class="notFound">
    <p class="q-pa-none">おや？　お探しのワールドは存在しないようです</p>
  </div>
</template>

<style scoped lang="scss">
.list {
  max-width: 1000px;
  margin: 0 auto;
}

.notFound {
  height: 75%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
