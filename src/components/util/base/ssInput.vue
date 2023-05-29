<script setup lang="ts">
import { ValidationRule } from 'quasar/dist/types/api/validation'
import { computed } from 'vue'

interface Prop {
  modelValue: any
  label?: string
  dense?: boolean
  autofocus?: boolean
  rules?: ValidationRule[]
  onClear?: (value: string) => void
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
  <q-input
    v-model="model"
    :label="label"
    :dense="dense"
    :autofocus="autofocus"
    :rules="rules"
    clearable
    @clear="onClear"
    class="font"
  >
    <template v-slot:label>
      <p class="q-pb-sm">{{ label }}</p>
    </template>
  </q-input>
</template>

<style scoped lang="scss">
.font {
  font-size: 1.1rem;
}
</style>