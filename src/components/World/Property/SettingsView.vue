<script setup lang="ts">
import { usePropertyStore } from 'src/stores/WorldTabsStore';
import SettingBlockView from './SettingBlockView.vue';

const propertyStore = usePropertyStore()
</script>

<template>
  <template v-for="key in propertyStore.searchProperties()" :key="key">
    <SettingBlockView :setting-name="key"/>
  </template>
</template>