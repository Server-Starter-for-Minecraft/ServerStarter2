<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { QInput, ValidationRule } from 'quasar';
import { showUnexpectedError } from 'src/error/error';
import { runDetached } from 'app/src-public/scripts/promise/runDetached';

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
const input = ref<QInput | null>(null);
const isPwd = ref(prop.secret);

// 読み込み時にバリデーションが実行されるようにする
onMounted(() => {
  // 非同期の検証規則がある場合は Promise を返すため，失敗を表示できるよう完了を待たずに実行する
  runDetached(Promise.resolve(input.value?.validate()), showUnexpectedError);
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
    <template v-if="$slots.prepend" v-slot:prepend>
      <slot name="prepend" />
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
