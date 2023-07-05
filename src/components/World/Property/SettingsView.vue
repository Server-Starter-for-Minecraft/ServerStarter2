<script setup lang="ts">
import { computed } from 'vue';
import { ServerProperties } from 'app/src-electron/schema/serverproperty';
import { usePropertyStore } from 'src/stores/WorldTabs/PropertyStore'
import SettingBlockView from './SettingBlockView.vue';

interface Prop {
  modelValue: ServerProperties
}

const propertyStore = usePropertyStore()

const prop = defineProps<Prop>()
const emit = defineEmits(['update:model-value'])

const model = computed({
  get() {
    return prop.modelValue;
  },
  set(newValue) {
    emit('update:model-value', newValue);
  },
})
</script>

<template>
  <template v-for="key in propertyStore.searchProperties()" :key="key">
    <SettingBlockView v-model="model" :setting-name="key" />
  </template>
</template>