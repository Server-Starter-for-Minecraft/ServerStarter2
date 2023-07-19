<script setup lang="ts">
import { baseDialogProp } from './iBaseDialog';
import SsBtn from 'src/components/util/base/ssBtn.vue';

defineProps<baseDialogProp>()
</script>

<template>
  <q-card flat class="q-py-sm q-px-md">
    <q-card-section class="q-pt-xs">
      <div class="caption q-pb-sm">GitHub</div>
      <div class="title" :class="color !== void 0 ? `text-${color}` : ''">{{ title }}</div>
    </q-card-section>

    <q-card-section>
      <slot />
    </q-card-section>

    <q-card-actions align="right">
      <ss-btn
        :disable="disable"
        :label="okBtnTxt"
        :color="color ?? 'primary'"
        @click="onOkClick"
      />
    </q-card-actions>
  </q-card>
</template>

<style scoped lang="scss">
.title {
  font-size: 1.5rem;
}
</style>