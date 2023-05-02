<script setup lang="ts">
import HeaderVue from 'src/components/MainLayout/HeaderVue.vue';
import DrawerVue from 'src/components/MainLayout/DrawerVue.vue';
</script>

<template>
  <q-layout view="hHh Lpr rff">
    <HeaderVue/>

    <DrawerVue/>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>
