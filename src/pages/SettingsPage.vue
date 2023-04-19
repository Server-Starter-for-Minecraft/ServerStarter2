<script setup lang="ts">
import { useMainStore } from 'src/stores/MainStore';

useMainStore().setHeader('システム設定', {});
</script>

<template>
  <div class="q-pa-md">
    <h1>詳細設定</h1>
  </div>
</template>
