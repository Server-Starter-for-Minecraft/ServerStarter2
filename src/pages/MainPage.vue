<script setup lang="ts">
import { worldStore } from 'app/src-electron/core/server/ServerStore';
import { Version } from 'app/src-electron/core/server/version/version';
import { World } from 'app/src-electron/core/server/world/world';
import { progressStore } from './ProgressPage/ProgressStore';

const demoVersion = new Version('Vanilla')
worldStore().world = new World('testWorld', demoVersion)
const run = async () => {
  progressStore().message = '1.0.0 / testWorldを起動中'
  window.API.runServer()
}
</script>

<template>
  <q-page>
    <q-btn to="progress" @click="run()">Run Server</q-btn>
  </q-page>
</template>