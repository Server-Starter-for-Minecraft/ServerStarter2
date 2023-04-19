<script setup lang="ts">
import worldVue from 'app/src/components/Main/WorldVue.vue';
import { useMainStore } from 'src/stores/MainStore';
</script>

<template>
  <q-virtual-scroll
    :items="useMainStore().showWorldList"
    separator
    v-slot="{ item, index }"
    class="q-pa-sm mainField fit"
    :items-size="500"
    style="flex: 1 1 0"
  >
    <world-vue :world="item" :idx="index" />
  </q-virtual-scroll>
  <div v-show="useMainStore().showWorldList.length == 0" class="col row fit justify-center items-center">
    <p class="q-pa-none">おや？ お探しのワールドは存在しないようです</p>
  </div>
</template>
