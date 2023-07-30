<script setup lang="ts">
import SsInput from '../util/base/ssInput.vue';


const model = defineModel<string | number>()
</script>

<template>
  <q-item>
    <q-item-section avatar>
      <q-icon name="search" size="2rem" class="q-py-sm"/>
    </q-item-section>
    <q-item-section>
      <ss-input v-model="model" :label="$t('worldList.searchWorld')"/>
    </q-item-section>
  </q-item>
</template>