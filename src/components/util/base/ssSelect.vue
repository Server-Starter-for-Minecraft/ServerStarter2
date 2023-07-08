<script setup lang="ts">

interface Prop {
  options?: readonly any[]
  label?: string
  disable?: boolean
  dense?: boolean
  optionLabel?: string
  optionValue?: string
}

const prop = defineProps<Prop>()
const model = defineModel()
</script>

<template>
  <q-select
    v-model="model"
    :options="options"
    :label="label"
    :dense="dense"
    class="font"
    :popup-content-style="{fontSize: '0.9rem'}"
    :disable="disable"
    emit-value
    map-options
    :option-label="optionLabel"
    :option-value="optionValue"
  >
    <template v-slot:label>
      <p class="font q-pb-sm">{{ label }}</p>
    </template>
  </q-select>
</template>

<style scoped lang="scss">
.font {
  font-size: 1rem;
}
</style>