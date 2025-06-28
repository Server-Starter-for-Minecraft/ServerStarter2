<script setup lang="ts">
import { ref } from 'vue';

interface Prop {
  autoFocus: boolean;
  validater: (text: any) => boolean | string;
}
const prop = defineProps<Prop>();

const text = defineModel<string>({ required: true });
const isEdit = ref(false);
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
