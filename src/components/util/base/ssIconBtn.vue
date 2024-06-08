<script setup lang="ts">
import { QBtnProps } from 'quasar';
import SsBtn from './ssBtn.vue';
import SsTooltip from './ssTooltip.vue';

interface Prop {
  icon?: string;
  iconSrc?: string;
  tooltip: string;
  onClick: () => void;
}
const prop = defineProps<Prop & QBtnProps>();
</script>

<template>
  <SsBtn v-bind="prop" free-width dense @click="onClick">
    <q-avatar v-if="iconSrc" square class="q-ma-xs">
      <q-icon :name="iconSrc" />
    </q-avatar>

    <SsTooltip :name="tooltip" anchor="bottom middle" self="center middle" />
  </SsBtn>
</template>
