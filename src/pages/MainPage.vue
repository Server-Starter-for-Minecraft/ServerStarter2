<script setup lang="ts">
import { Version } from 'app/src-electron/core/server/version/version';
import { World } from 'app/src-electron/core/server/world/world';
import { progressStore } from './Progress/ProgressStore';

const run = async () => {
  progressStore().message = '1.0.0 / testWorldを起動中'
  const demoVersion = new Version('Vanilla')
  const world = new World('testWorld', demoVersion)
  window.API.runServer(world)
}
</script>

<template>
  <q-page>
    <q-btn to="progress" @click="run()">Run Server</q-btn>
  </q-page>
</template>