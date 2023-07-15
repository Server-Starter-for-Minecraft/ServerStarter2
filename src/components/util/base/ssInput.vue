<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ValidationRule } from 'quasar/dist/types/api/validation'

interface Prop {
  label?: string
  placeholder?: string
  dense?: boolean
  autofocus?: boolean
  debounce?: number
  rules?: ValidationRule[]
  onClear?: (value: string) => void
}

const prop = defineProps<Prop>()
const model = defineModel<string | number>()
const input = ref()

// 読み込み時にバリデーションが実行されるようにする
onMounted(() => { input.value.validate() })
</script>

<template>
  <q-input
    ref="input"
    v-model="model"
    filled
    :label="label"
    :placeholder="placeholder"
    :dense="dense"
    :autofocus="autofocus"
    :rules="rules"
    :debounce="debounce"
    clearable
    @clear="onClear"
    class="font"
  >
    <template v-slot:label>
      <p class="text-caption">{{ label }}</p>
    </template>
  </q-input>
</template>

<style scoped lang="scss">
.font {
  font-size: 1.1rem;
}

::v-deep ::placeholder {
  font-size: 0.7rem;
}
</style>