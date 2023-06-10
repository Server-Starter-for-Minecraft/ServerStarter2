<script setup lang="ts">
import { FileData, NewData } from 'app/src-electron/schema/filedata';
import ItemCardView from './itemCardView.vue';

interface Prop {
  type: 'datapack' | 'plugin' | 'mod'
  itemNames: (FileData | NewData)[]
  candidateItems: (FileData | NewData)[]
}
defineProps<Prop>()
</script>

<template>
  <div class="q-pl-xl">
    <h1>{{ type }}管理</h1>
  
    <h2>導入済み{{ type }}</h2>
    <div class="q-pa-md row items-start q-gutter-md">
      <template v-for="item in itemNames" :key="item">
        <ItemCardView :name="item.name" :desc="item.description" action-type="delete" />
      </template>
    </div>
    
    <h2>{{ type }}を追加</h2>
    <div class="q-pa-md row items-start q-gutter-md">
      <ItemCardView name="新規" action-type="add" color="red"/>
      <template v-for="item in candidateItems" :key="item">
        <ItemCardView :name="item.name" :desc="item.description" action-type="add" />
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
h1 {
  margin-top: 0;
  font-size: 2.5rem;
}

h2 {
  font-size: 2rem;
}
</style>