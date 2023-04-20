<script setup lang="ts">
import { useMainStore } from 'src/stores/MainStore';
import { useWorldEditStore } from 'src/stores/WorldEditStore';
import WorldEditPage from '../components/WorldEdit/WorldEditVue.vue';

useMainStore().setHeader('ワールド編集', {showMenuBtn: true});

async function saveFunc() {
  useMainStore().worldList[useWorldEditStore().worldIndex] = useWorldEditStore().world
}
</script>

<template>
  <WorldEditPage :save-func="saveFunc"/>
</template>