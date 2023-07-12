<script setup lang="ts">
import { ref } from 'vue';
import WorldList from 'src/components/MainLayout/WorldList.vue';
import WorldPage from 'src/pages/WorldPage.vue';

const miniChangeWidth = 200
const drawer = ref(true)
const splitterModel = ref(300)
</script>

<template>
  <q-layout view="hHh Lpr rff">
    <div class="row">
      <q-splitter
        v-model="splitterModel"
        :limits="[100, 400]"
        unit="px"
        emit-immediately
        style="height: 100vh; width: 100vw;"
      >
        <template #before>
          <q-drawer
            v-model="drawer"
            :width="splitterModel"
            :breakpoint="0"
            :mini="splitterModel < miniChangeWidth"
            :mini-width="Math.min(miniChangeWidth, splitterModel)"
            :class="`column ${$q.dark.isActive ? 'bg-grey-9' : 'bg-grey-3'}`"
            style="height: 100vh;"
          >
            <WorldList/>
          </q-drawer>
        </template>
        <template #after>
          <WorldPage />
        </template>
      </q-splitter>
    </div>
  </q-layout>
</template>
