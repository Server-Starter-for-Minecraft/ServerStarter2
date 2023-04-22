<script setup lang="ts">
import ConsoleVue from 'src/components/Console/ConsoleVue.vue';
import HeaderVue from 'src/components/Console/HeaderVue.vue';
import OperationVue from 'src/components/Console/OperationVue.vue';
</script>

<template>
  <q-page class="column">
    <HeaderVue/>
    <ConsoleVue/>
    <OperationVue/>
  </q-page>
</template>