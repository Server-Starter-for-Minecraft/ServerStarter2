<script setup lang="ts">
import { ImageURI } from 'app/src-electron/schema/brands';
import { useMainStore } from 'src/stores/MainStore';

interface Prop {
  logo: ImageURI
  onCloseEvent: (payload?: any) => void
}
const prop = defineProps<Prop>()

const mainStore = useMainStore()
const btnSize = 3

function setIcon() {
  mainStore.iconCandidate = prop.logo
  prop.onCloseEvent()
}
</script>

<template>
  <q-avatar square :size="`${btnSize}rem`" >
    <q-img
      :src="logo"
      :ratio="1"
      style="image-rendering: pixelated;"
    />
    <q-btn
      dense
      flat
      :size="`${btnSize/2 - .2}rem`"
      icon=""
      class="absolute-center"
      @click="setIcon"
    />
  </q-avatar>
</template>