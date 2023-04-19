<script setup lang="ts">
import { demoWorldList, useMainStore } from 'src/stores/MainStore';
import { ref } from 'vue';

const text = ref('');
const sortType = ref('名前');
const sortTypes = ['名前', '最終プレイ'];
</script>

<template>
  <div class="row q-ma-md">
    <q-btn color="primary" to="new-world">新規作成</q-btn>

    <q-input
      v-model="text"
      clearable
      label="検索"
      @keyup="useMainStore().showWorldList = demoWorldList.filter(world => world.name.match(text))"
      @clear="useMainStore().showWorldList = demoWorldList"
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
</template>