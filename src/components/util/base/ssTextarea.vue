<script setup lang="ts">
import { ref } from 'vue';

interface Prop {
  autofocus?: boolean;
  height?: string;
}
const prop = defineProps<Prop>();
const innerText = defineModel<string>({ required: true });
const innerField = ref();

function focusTextarea() {
  if (prop.autofocus) {
    innerField.value?.focus();
  }
}
</script>

<template>
  <q-field filled :autofocus="autofocus" @focus="focusTextarea">
    <template v-slot:control>
      <textarea
        v-model="innerText"
        ref="innerField"
        class="textarea no-outline q-py-sm"
        :class="$q.dark.isActive ? 'q-dark' : ''"
        :style="height ? { height: height } : {}"
        @click.stop="() => {}"
        tabindex="0"
      ></textarea>
    </template>
  </q-field>
</template>

<style scoped lang="scss">
.textarea {
  resize: none;
  background-color: transparent;
  border: transparent;
  width: 100%;
}
</style>
