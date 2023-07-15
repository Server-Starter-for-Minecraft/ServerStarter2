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
    filled
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
    style="font-size: .9rem;"
  >
  </q-select>
</template>