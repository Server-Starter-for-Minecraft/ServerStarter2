<script setup lang="ts">
import { mainStore } from 'src/stores/MainStore';

mainStore().setHeader('システム設定', {})
</script>

<template>
  <div class="q-pa-md">
    <h1>詳細設定</h1>
  </div>
</template>