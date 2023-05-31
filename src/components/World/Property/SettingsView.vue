<script setup lang="ts">
import { useWorldTabsStore } from 'src/stores/WorldTabsStore';
import SettingBlockView from './SettingBlockView.vue';

const worldStore = useWorldTabsStore()
</script>

<template>
  <template v-for="key in worldStore.searchProperties()" :key="key">
    <SettingBlockView :setting-name="key"/>
  </template>
</template>