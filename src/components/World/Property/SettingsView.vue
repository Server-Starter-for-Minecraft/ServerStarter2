<script setup lang="ts">
import { useWorldTabsStore } from 'src/stores/WorldTabsStore';
import { propertyClasses } from './classifications';
import SettingBlockView from './SettingBlockView.vue';

const worldStore = useWorldTabsStore()
</script>

<template>
  <template v-for="key in propertyClasses[worldStore.property.selectTab]" :key="key">
    <SettingBlockView :setting-name="key"/>
  </template>
</template>