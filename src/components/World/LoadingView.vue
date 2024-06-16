<script setup lang="ts">
import { useMainStore } from 'src/stores/MainStore';
import { useWorldStore } from 'src/stores/WorldStore';

const mainStore = useMainStore();
const worldStore = useWorldStore();
</script>

<template>
  <div class="row items-center q-gutter-x-md">
    <q-spinner color="primary" size="3em" />
    <span class="col">
      {{
        $t('mainLayout.loading', {
          name: worldStore.worldList[mainStore.selectedWorldID].world.name,
        })
      }}
    </span>
  </div>
</template>
