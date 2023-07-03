<script setup lang="ts">
import { computed } from 'vue';
import { ServerProperties } from 'app/src-electron/schema/serverproperty';

interface Prop {
  modelValue: ServerProperties
}
const prop = defineProps<Prop>()
const emit = defineEmits(['update:model-value'])

const propertiesModel = computed({
  get() {
    return prop.modelValue;
  },
  set(newValue) {
    emit('update:model-value', newValue);
  },
})

const playerJoinToggle = computed({
  get() {
    return propertiesModel.value['white-list'] && propertiesModel.value['enforce-whitelist'];
  },
  set(newValue) {
    propertiesModel.value['white-list'] = newValue;
    propertiesModel.value['enforce-whitelist'] = newValue;
  },
})
</script>

<template>
  <q-toggle
    v-model="playerJoinToggle"
    :label="$t('player.join')"
    style="font-size: 1rem;"
  />
</template>