<script setup lang="ts">
import { useMainStore } from 'src/stores/MainStore';
import { useWorldEditStore } from 'src/stores/WorldEditStore';
import WorldEditPage from '../components/WorldEdit/WorldEditVue.vue';


async function saveFunc() {
  useMainStore().worldList[useWorldEditStore().worldIndex] = useWorldEditStore().world
}
</script>

<template>
  <WorldEditPage title="ワールド編集" :save-func="saveFunc"/>
</template>