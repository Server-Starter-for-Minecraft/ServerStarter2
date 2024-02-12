<script setup lang="ts">
import SsTooltip from 'src/components/util/base/ssTooltip.vue';
interface Props {
  icon: string;
  text: string;
  color?: string;
  size?: string;
  to?: string;
  disable?: boolean;
  onClick?: (evt: Event) => void;
}
defineProps<Props>();
</script>

<template>
  <q-btn
    flat
    :icon="icon"
    :color="color"
    :size="size"
    :to="to"
    :disable="disable"
    @click="onClick"
  >
    <span class="gt-md q-pl-sm">{{ text }}</span>
    <SsTooltip :name="text" anchor="center middle" self="top middle" />
  </q-btn>
</template>
