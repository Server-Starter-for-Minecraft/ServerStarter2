<script setup lang="ts">
import { QSelect } from 'quasar';
import { onMounted, ref } from 'vue';

interface Prop {
  options?: readonly any[];
  label?: string;
  disable?: boolean;
  dense?: boolean;
  optionLabel?: string;
  optionValue?: string;
  loading?: boolean;
  rules?: ((val: any) => boolean | string)[];
}

const prop = defineProps<Prop>();
const model = defineModel();
const selectRef = ref<InstanceType<typeof QSelect> | null>(null);

onMounted(() => {
  selectRef.value?.validate()
});
</script>

<template>
  <q-select
    ref="selectRef"
    v-model="model"
    filled
    :options="options"
    :label="label"
    :dense="dense"
    :loading="loading"
    :rules="rules"
    :popup-content-style="{ fontSize: '0.9rem' }"
    :disable="disable"
    emit-value
    map-options
    :option-label="optionLabel"
    :option-value="optionValue"
    style="font-size: 0.9rem"
  >
    <template v-slot:option="scope">
      <slot
        name="option"
        :index="scope.index"
        :opt="scope.opt"
        :selected="scope.selected"
        :focused="scope.focused"
        :toggleOption="scope.toggleOption"
        :setOptionIndex="scope.setOptionIndex"
        :itemProps="scope.itemProps"
      />
    </template>
  </q-select>
</template>
