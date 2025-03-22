<script setup lang="ts">
import { computed, ref } from 'vue';
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
// Objectが来た時に包含判定が崩れないよう，inを使わずにsomeを使う
const checkInOptions = () =>
  prop.options?.some((val) => val === model.value) ?? true;
// InputBoxにフォーカスが当たっているかどうか
const isFocusInput = ref(false);

const computedModel = computed({
  get: () => {
    if (!prop.enableOther || (prop.options?.length ?? 0) === 0) {
      return model.value;
    }
    return checkInOptions() ? model.value : 'other';
  },
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
    <!-- 入力途中で偶然Optionsにある内容を入力したとしても，
         突然InputBoxが消えることがないように`isInputFocus`を考慮する -->
    <SsInput
      v-if="typeof model === 'string'"
      v-show="(prop.enableOther && !checkInOptions()) || isFocusInput"
      v-model="model"
      dense
      @focusin="isFocusInput = true"
      @focusout="isFocusInput = false"
      class="q-pt-sm"
    />
  </div>
</template>
