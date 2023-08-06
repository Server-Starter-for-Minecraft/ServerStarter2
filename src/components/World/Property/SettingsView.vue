<script setup lang="ts">
import { ServerProperties } from 'app/src-electron/schema/serverproperty';
import { usePropertyStore } from 'src/stores/WorldTabs/PropertyStore'
import SettingBlockView from './SettingBlockView.vue';

const model = defineModel<ServerProperties>({ required: true })
const propertyStore = usePropertyStore()
</script>

<template>
  <div v-if="propertyStore.searchProperties(model).length !== 0">
    <template v-for="key in propertyStore.searchProperties(model)" :key="key">
      <SettingBlockView v-model="model" :setting-name="key" />
    </template>
  </div>
  <div v-else>
    <p class="q-pl-md" style="font-size: .8rem; padding-top: 14px;">
      プロパティが見つかりませんでした
    </p>
  </div>
</template>