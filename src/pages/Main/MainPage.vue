<script setup lang="ts">
import { Version } from 'app/src-electron/core/server/version/version';
import { World } from 'app/src-electron/core/server/world/world';
import { useRouter } from 'vue-router';

// Demo用
const world = new World('testWorld', new Version('Vanilla', '1.0.0'))

// コードからRouterへアクセス
const router = useRouter()
const goConsole = async () => {
  await router.push('console')
}
const goProgress = async () => {
  await router.push('progress')
}


async function runServer(world:World) {
  goProgress()
  await window.API.readyServer(world)
  goConsole()
  await window.API.runServer(world)
}
</script>

<template>
  <q-btn @click="runServer(world)">Run Server</q-btn>
</template>