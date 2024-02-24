<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ValidationRule } from 'quasar/dist/types/api/validation';

interface Prop {
  label?: string;
  placeholder?: string;
  hint?: string;
  dense?: boolean;
  disable?: boolean;
  autofocus?: boolean;
  secret?: boolean;
  debounce?: number;
  rules?: ValidationRule[];
  onClear?: (value: string | number) => void;
}

const prop = defineProps<Prop>();
const model = defineModel<string | number>();
const input = ref();
const isPwd = ref(prop.secret);

// 読み込み時にバリデーションが実行されるようにする
onMounted(() => {
  input.value.validate();
});

function onClearClick() {
  // modelの値をリセット
  model.value = '';

  // 特殊な処理がある場合は実行
  if (prop.onClear !== void 0) {
    prop.onClear(model.value);
  }
}
</script>

<template>
  <q-input
    ref="input"
    v-model="model"
    filled
    :label="label"
    :placeholder="placeholder"
    :hint="hint"
    :dense="dense"
    :disable="disable"
    :autofocus="autofocus"
    :type="isPwd ? 'password' : 'text'"
    :rules="rules"
    :debounce="debounce"
    :clearable="!secret"
    @clear="onClearClick"
    class="font"
  >
    <template v-slot:append>
      <q-icon
        v-show="secret"
        :name="isPwd ? 'visibility_off' : 'visibility'"
        class="cursor-pointer"
        @click="isPwd = !isPwd"
      />
    </template>
  </q-input>
</template>

<style scoped lang="scss">
.font {
  font-size: 0.9rem;
}

:deep(::placeholder) {
  font-size: 0.7rem;
}
</style>
