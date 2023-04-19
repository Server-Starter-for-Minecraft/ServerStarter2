<script setup lang="ts">
import worldVue from 'app/src/components/Main/WorldVue.vue';
import { useMainStore } from 'src/stores/MainStore';
</script>

<template>
  <q-virtual-scroll
    :items="useMainStore().showWorldList"
    separator
    v-slot="{ item, index }"
    class="col q-pa-sm mainField"
    :items-size="500"
    style="width: 100%;"
  >
    <world-vue :world="item" :idx="index" />
  </q-virtual-scroll>

  <div v-show="useMainStore().showWorldList.length == 0" class="col">
    <p class="q-pa-none">おや？　お探しのワールドは存在しないようです</p>
  </div>
</template>