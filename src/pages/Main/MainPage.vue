<script setup lang="ts">
import worldVue from 'app/src/components/Main/WorldVue.vue';
import { Version } from 'app/src-electron/core/server/version/version';
import { World } from 'app/src-electron/core/server/world/world';
import { useRouter } from 'vue-router';

window.API.onStartServer((_: Electron.IpcRendererEvent) => goConsole());

async function runServer(world: World) {
  goProgress();
  await window.API.runServer(world);
}

// Demo用
const world = new World('testWorld', new Version('Vanilla', '1.0.0'));

// コードからRouterへアクセス
const router = useRouter();
const goConsole = async () => {
  await router.push('console');
};
const goProgress = async () => {
  await router.push('progress');
};

const worldlist = [
  {
    avater: 'https://cdn.quasar.dev/img/parallax2.jpg',
    version: '1.0.0',
    worldName: 'testWorld',
  },
  {
    avater: 'https://cdn.quasar.dev/img/parallax2.jpg',
    version: '1.0.0',
    worldName: 'testWorld',
  },
  {
    avater: 'https://cdn.quasar.dev/img/parallax2.jpg',
    version: '1.0.0',
    worldName: 'testWorld',
  },
  {
    avater: 'https://cdn.quasar.dev/img/parallax2.jpg',
    version: '1.0.0',
    worldName: 'testWorld',
  },
];
</script>

<template>
  <q-list bordered padding>
    <template v-for="(world, index) in worldlist" :key="index">
      <world-vue
        :avater="world.avater"
        :version="world.version"
        :world-name="world.worldName"
      />
    </template>
    <!-- <q-item clickable>
      <q-item-section avatar>
        <q-icon color="primary" name="bluetooth"/>
      </q-item-section>
      <q-item-section>testWorld</q-item-section>
      <q-item-section side>
        <q-item-label caption>meta</q-item-label>
      </q-item-section>
    </q-item>
    <q-item clickable>
      <q-item-section avatar>
        <q-icon color="primary" name="bluetooth"/>
      </q-item-section>
      <q-item-section>testWorld</q-item-section>
      <q-item-section side>
        <q-item-label caption>meta</q-item-label>
      </q-item-section>
    </q-item>
    <q-item clickable>
      <q-item-section avatar>
        <q-icon color="primary" name="bluetooth"/>
      </q-item-section>
      <q-item-section>testWorld</q-item-section>
      <q-item-section side>
        <q-item-label caption>meta</q-item-label>
      </q-item-section>
    </q-item>
    <q-item clickable>
      <q-item-section avatar>
        <q-img src="https://cdn.quasar.dev/img/parallax2.jpg"/>
      </q-item-section>
      <q-item-section>testWorld</q-item-section>
      <q-item-section side>
        <q-item-label caption>meta</q-item-label>
      </q-item-section>
    </q-item> -->
  </q-list>
  <q-btn @click="runServer(world)">Run Server</q-btn>
</template>
