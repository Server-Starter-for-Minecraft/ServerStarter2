<script setup lang="ts">
import { PlayerUUID } from 'app/src-electron/schema/brands';

interface Prop {
  name: string
  players: PlayerUUID[]
}
defineProps<Prop>()
</script>

<template>
  <q-card flat bordered class="q-ma-xs">
    <q-item>
      <q-item-section>
        <q-item-label>{{ name }}</q-item-label>
        <q-item-label caption>
          test
        </q-item-label>
      </q-item-section>
    </q-item>
  </q-card>
</template>