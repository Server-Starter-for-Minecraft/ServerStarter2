<script setup lang="ts">
import { runServer } from './MainVM';

// Demo用
import { Version } from 'app/src-electron/core/server/version/version';
import { World } from 'app/src-electron/core/server/world/world';
const world = new World('testWorld', new Version('Vanilla', '1.0.0'))
</script>

<template>
  <q-btn to="progress" @click="runServer(world)">Run Server</q-btn>
</template>