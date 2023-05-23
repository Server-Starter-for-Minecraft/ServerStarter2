<script setup lang="ts">
import WorldList from 'src/components/MainLayout/WorldList.vue';
import WorldPage from 'src/pages/WorldPage.vue';
</script>

<template>
  <q-layout view="hHh Lpr rff">
    <q-page-container class="row">
      <WorldList/>
      <WorldPage/>
    </q-page-container>
  </q-layout>
</template>
