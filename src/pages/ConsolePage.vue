<script setup lang="ts">
import ConsoleVue from 'src/components/Console/ConsoleVue.vue';
import HeaderVue from 'src/components/Console/HeaderVue.vue';
import OperationVue from 'src/components/Console/OperationVue.vue';
</script>

<template>
  <q-page class="column">
    <!-- <div class="bg-red col">aaaaa</div>
    <div class="bg-blue col">aaaaa</div> -->
    <HeaderVue class="col"/>
    <ConsoleVue class="col-auto"/>
    <OperationVue class="col"/>
  </q-page>
</template>