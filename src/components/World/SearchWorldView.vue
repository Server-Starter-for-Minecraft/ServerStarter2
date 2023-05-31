<script setup lang="ts">
import { computed } from 'vue'
import SsInput from '../util/base/ssInput.vue';

interface Prop {
  modelValue: string | number
}
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
  <q-item>
    <q-item-section avatar>
      <q-icon name="search" size="2rem" class="q-py-sm"/>
    </q-item-section>
    <q-item-section>
      <ss-input v-model="model" label="ワールドを検索" @clear="() => model = ''"/>
    </q-item-section>
  </q-item>
</template>