<script setup lang="ts">
import { getCssVar } from 'quasar';

type Anchor =
  | 'top left'
  | 'top middle'
  | 'top right'
  | 'top start'
  | 'top end'
  | 'center left'
  | 'center middle'
  | 'center right'
  | 'center start'
  | 'center end'
  | 'bottom left'
  | 'bottom middle'
  | 'bottom right'
  | 'bottom start'
  | 'bottom end';

type Self =
  | 'top left'
  | 'top middle'
  | 'top right'
  | 'top start'
  | 'top end'
  | 'center left'
  | 'center middle'
  | 'center right'
  | 'center start'
  | 'center end'
  | 'bottom left'
  | 'bottom middle'
  | 'bottom right'
  | 'bottom start'
  | 'bottom end';

interface Prop {
  name: string;
  anchor?: Anchor;
  self?: Self;
  fontSize?: string;
}
defineProps<Prop>();
</script>

<template>
  <q-tooltip :anchor="anchor" :self="self" :delay="500" class="bg-transparent">
    <div
      class="q-pa-xs"
      :style="{
        color: $q.dark.isActive ? 'white' : 'black',
        'background-color': $q.dark.isActive
          ? getCssVar('dark')?.toString()
          : 'white',
        border: `1.5px solid grey`,
        'font-size': fontSize ?? '.7rem',
      }"
      style="
        word-break: break-word;
        border-radius: 5px;
        white-space: pre-line;
        width: max-content;
      "
    >
      {{ name }}
    </div>
  </q-tooltip>
</template>
