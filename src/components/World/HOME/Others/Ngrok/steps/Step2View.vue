<script setup lang="ts">
import { ref } from 'vue';

const slide = ref(1)
</script>

<template>
  <div>
    <p class="text-caption">
      画面に沿ってアカウント登録を完了しましょう！
    </p>

    
    <q-carousel
      v-model="slide"
      animated
      transition-prev="slide-right"
      transition-next="slide-left"
      control-color="white"
      navigation
      padding
      arrows
      height="300px"
      class="bg-primary text-white shadow-1 rounded-borders"
    >
      <q-carousel-slide :name="1" img-src="https://cdn.quasar.dev/img/mountains.jpg" />
      <q-carousel-slide :name="2" img-src="https://cdn.quasar.dev/img/parallax1.jpg" />
      <q-carousel-slide :name="3" img-src="https://cdn.quasar.dev/img/parallax2.jpg" />
      <q-carousel-slide :name="4" img-src="https://cdn.quasar.dev/img/quasar.jpg" />
    </q-carousel>


  
  </div>
</template>