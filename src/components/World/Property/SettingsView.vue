<script setup lang="ts">
import { ServerProperties } from 'app/src-electron/schema/serverproperty';
import { usePropertyStore } from 'src/stores/WorldTabs/PropertyStore'
import SettingBlockView from './SettingBlockView.vue';

const model = defineModel<ServerProperties>({ required: true })
const propertyStore = usePropertyStore()
</script>

<template>
  <template v-for="key in propertyStore.searchProperties()" :key="key">
    <SettingBlockView v-model="model" :setting-name="key" />
  </template>
</template>