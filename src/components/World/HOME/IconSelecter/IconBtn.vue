<script setup lang="ts">
import { ImageURI } from 'app/src-electron/schema/brands';

interface Prop {
  logo: ImageURI
}
defineProps<Prop>()
</script>

<template>
  <q-avatar square size="2rem" class="q-pb-sm" >
    <q-img :src="logo" :ratio="1" />
    <q-btn
      dense
      flat
      outline
      size="1rem"
      icon=""
      class="absolute-center"
    />
  </q-avatar>
</template>