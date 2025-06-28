<script setup lang="ts">
interface Prop {
  autoFocus: boolean;
  validater: (text: any) => boolean | string;
}
const prop = defineProps<Prop>();

const text = defineModel<string>('name', { required: true });
let oldName = text.value;

const isEdit = defineModel<boolean>('isEdit', {
  required: true,
  get(value) {
    return value;
  },
  set(value) {
    // 編集モードを解除する際に，バリデーションがエラーの場合は元の名称を入れて戻す
    if (!value && prop.validater(text.value) !== true) {
      text.value = oldName;
    } else {
      oldName = text.value;
    }
    return value;
  },
});
</script>

<template>
  <p
    v-if="!isEdit"
    @dblclick.stop="isEdit = true"
    class="text text-omit q-ma-none"
  >
    {{ text }}
  </p>
  <q-input
    v-else
    v-model="text"
    :autofocus="autoFocus"
    dense
    filled
    :rules="[validater]"
    @focusout="isEdit = false"
    class="text q-pa-none"
  />
</template>

<style lang="scss" scoped>
.text {
  font-size: 1rem;
  max-width: 100%;
}
</style>
