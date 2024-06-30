<script setup lang="ts">
import { useMainStore } from 'src/stores/MainStore';

const mainStore = useMainStore();
</script>

<template>
  <div class="row items-center q-gutter-x-md">
    <q-spinner color="primary" size="3em" />
    <span class="col">
      {{
        $t('mainLayout.loading', {
          name: mainStore.allWorlds.readonlyWorlds[mainStore.selectedWorldID]
            .world.name,
        })
      }}
    </span>
  </div>
</template>
