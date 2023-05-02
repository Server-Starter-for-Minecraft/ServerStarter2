<script setup lang="ts">
import { useMainStore } from 'src/stores/MainStore';

useMainStore().setHeader('システム設定', { showMenuBtn: true });

interface Menu {
  title: string
  url: string
}
const indexDrawer: Menu[] = [
  {
    title: 'test',
    url: 'test'
  }
]
</script>

<template>
  <q-drawer side="right" v-model="useMainStore().leftDrawerOpen" show-if-above bordered>
    <q-list>
      <q-item-label header>Essential Links</q-item-label>
      <q-item clickable target="_blank" rel="noopener" href="https://quasar.dev">
        <q-item-section avatar>
          <q-icon name="school" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Docs</q-item-label>
          <q-item-label caption>https://quasar.dev</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </q-drawer>
  <div class="q-pa-md">
    <h1>詳細設定</h1>
  </div>
</template>
