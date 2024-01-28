<script setup lang="ts">
import { ImageURI } from 'app/src-electron/schema/brands';
import { IconSelectReturn } from './iIconSelect';

interface Prop {
  logo: ImageURI;
  onCloseEvent: (payload?: any) => void;
}
const prop = defineProps<Prop>();

const btnSize = 4;

function setIcon() {
  prop.onCloseEvent({ img: prop.logo } as IconSelectReturn);
}
</script>

<template>
  <q-avatar square :size="`${btnSize}rem`">
    <q-img :src="logo" :ratio="1" style="image-rendering: pixelated" />
    <q-btn
      dense
      flat
      :size="`${btnSize / 2 - 0.2}rem`"
      icon=""
      class="absolute-center"
      @click="setIcon"
    />
  </q-avatar>
</template>
