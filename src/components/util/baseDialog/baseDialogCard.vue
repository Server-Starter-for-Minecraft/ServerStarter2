<script setup lang="ts">
import { baseDialogProp } from './iBaseDialog';
import SsBtn from 'src/components/util/base/ssBtn.vue';

defineProps<baseDialogProp>();
</script>

<template>
  <q-card flat class="q-py-sm">
    <q-card-section class="q-pt-xs">
      <div class="caption q-pb-sm">{{ overline }}</div>
      <div class="title" :class="color !== void 0 ? `text-${color}` : ''">
        {{ title }}
      </div>
    </q-card-section>

    <q-card-section class="q-pt-none">
      <slot />
    </q-card-section>

    <q-card-actions align="right">
      <slot name="additionalBtns" />
      <ss-btn
        v-if="okBtnTxt !== void 0 || onOkClick !== void 0"
        :disable="disable"
        :loading="loading"
        :label="okBtnTxt"
        :color="color ?? 'primary'"
        @click="onOkClick"
      />
    </q-card-actions>

    <div v-if="onClose !== void 0 && !loading" class="absolute-top-right">
      <q-btn
        dense
        flat
        round
        icon="close"
        size="1rem"
        class="q-ma-sm"
        @click="onClose"
      />
    </div>
  </q-card>
</template>

<style scoped lang="scss">
.title {
  font-size: 1.2rem;
  padding-right: 2.5rem;
}
</style>
