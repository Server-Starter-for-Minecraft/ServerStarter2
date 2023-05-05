<script setup lang="ts">
import { ref } from 'vue';
import SsSelect from '../util/base/ssSelect.vue';
import PropertyItem from '../util/propertyItem.vue';
import TitleVue from './TitleVue.vue';

const players = ['test', 'test2']
const playerName = ref(players[0])
</script>

<template>
  <TitleVue title="Person List"/>
  
  <PropertyItem prop-name="プレイヤー名">
    <template v-slot:userInput>
      <SsSelect v-model="playerName" label="名前" :options="players"/>
    </template>
  </PropertyItem>
</template>

<style scoped lang="scss">
</style>