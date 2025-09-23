<script setup lang="ts">
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';

interface Prop {
  disable?: boolean;
  src?: string;
  icon?: string;
  label: string;
  size: string;
  color?: string;
  onClick: () => void;
}
defineProps<Prop>();

const playerStore = usePlayerStore();
</script>

<template>
  <q-item
    clickable
    v-ripple
    dense
    :disable="playerStore.focusCards.size === 0 || disable"
    @click="onClick"
    class="q-py-xs"
  >
    <q-item-section avatar>
      <q-avatar v-if="icon === void 0" :size=size>
        <q-icon size="180%" :name="src" />
      </q-avatar>
      <q-icon v-else :name="icon" :color="color" :size=size />
    </q-item-section>
    <q-item-section>
      <span :class="`text-${color}`">{{ label }}</span>
    </q-item-section>
  </q-item>
</template>
