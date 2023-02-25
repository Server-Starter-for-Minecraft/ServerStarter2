<script setup lang="ts">
// import { runServer } from './MainVM';

// Demo用
import { Version } from 'app/src-electron/core/server/version/version';
import { World } from 'app/src-electron/core/server/world/world';
import { sleep } from 'app/src-electron/core/utils/testTools';
import { useRouter } from 'vue-router';
import { addConsole } from '../Console/ConsoleStore';
import { setStatus } from '../Progress/ProgressStore';
const world = new World('testWorld', new Version('Vanilla', '1.0.0'))

// Demo用（将来的にはMainVMへ移築）
const router = useRouter()
const goConsole = () => {
  router.push('/console')
}
async function runServer(world:World) {
  setStatus(`${world.version.name} / ${world.name}を起動中`)
  window.API.runServer(world)
  await sleep(5)
  setStatus('5秒経ったよ')
  await sleep(2)
  
  goConsole()
  addConsole('Start')
  await sleep(2)
  addConsole('Finished !!')
  await sleep(2)
  addConsole('CivilTT is entered the world')
}
</script>

<template>
  <q-btn to="progress" @click="runServer(world)">Run Server</q-btn>
</template>