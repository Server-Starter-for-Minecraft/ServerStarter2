<script setup lang="ts">
import { ref } from 'vue';
import { useMainStore } from 'src/stores/MainStore';
import worldVue from 'app/src/components/Main/WorldVue.vue';

const text = ref('');
const sortType = ref('名前');
const sortTypes = ['名前', '最終プレイ'];
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
          @clear="text = ''"
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
    :items="useMainStore().showWorldList(text)"
    separator
    v-slot="{ item, index }"
    class="q-pa-sm mainField fit"
    :items-size="500"
    style="flex: 1 1 0"
  >
    <world-vue :world="item" :idx="index" />
  </q-virtual-scroll>
  <div v-show="useMainStore().showWorldList(text).length == 0" class="col row justify-center items-center">
    <p class="q-pa-none">おや？ お探しのワールドは存在しないようです</p>
  </div>
</template>