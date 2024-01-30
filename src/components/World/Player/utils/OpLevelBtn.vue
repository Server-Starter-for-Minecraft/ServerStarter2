<script setup lang="ts">
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';

interface Prop {
  disable?: boolean;
  src?: string;
  icon?: string;
  label: string;
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
      <q-avatar v-if="icon === void 0" size="2rem">
        <q-icon size="1.8rem" :name="src" />
      </q-avatar>
      <q-icon v-else :name="icon" :color="color" size="2rem" />
    </q-item-section>
    <q-item-section>
      <span :class="`text-${color}`">{{ label }}</span>
    </q-item-section>
  </q-item>
</template>
