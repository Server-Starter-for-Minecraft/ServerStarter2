<script setup lang="ts">
import { computed } from 'vue';
import SsInput from './ssInput.vue';

interface Prop {
  options?: readonly any[];
  label?: string;
  disable?: boolean;
  dense?: boolean;
  optionLabel?: string;
  optionValue?: string;
  enableOther?: boolean;
}

const prop = defineProps<Prop>();
const model = defineModel({ required: true });

// model.valueがOptionsに含まれているかどうかを判定する
const checkInOptions = () => prop.options?.includes(model.value) ?? true;
// InputBoxの表示要否
const isShowInput = () => prop.enableOther && !checkInOptions();

const computedModel = computed({
  get: () => {
    if (!prop.enableOther || (prop.options?.length ?? 0) === 0) {
      return model.value;
    }
    // Objectが来た時に包含判定が崩れないよう，inを使わずにsomeを使う
    return prop.options?.some((val) => val === model.value)
      ? model.value
      : 'other';
  },
  set: (newVal) => {
    model.value = newVal;
  },
});
const inputModel = computed({
  get: () => model.value,
  set: (newVal) => {
    model.value = newVal;
  },
});

const editedOptions = prop.enableOther
  ? [...(prop.options ?? []), 'other']
  : prop.options;
</script>

<template>
  <div>
    <q-select
      v-model="computedModel"
      filled
      :options="editedOptions"
      :label="label"
      :dense="dense"
      :popup-content-style="{ fontSize: '0.9rem' }"
      :disable="disable"
      emit-value
      map-options
      :option-label="optionLabel"
      :option-value="optionValue"
      style="font-size: 0.9rem"
    />
    <SsInput
      v-if="typeof inputModel === 'string'"
      v-show="isShowInput()"
      v-model="inputModel"
      dense
      class="q-pt-sm"
    />
  </div>
</template>
