<script setup lang="ts">
import { CustomMapData } from 'app/src-electron/schema/filedata';

interface Prop {
  world: CustomMapData
  onClick?: () => void
}
defineProps<Prop>()
</script>

<template>
  <q-item
    :clickable="onClick !== void 0"
    @click="onClick"
    class="q-pl-none"
    style="width: 13rem; margin-right: 14px;"
  >
    <q-item-section avatar top>
      <q-avatar square size="3rem">
        <q-img :src="world.icon" />
      </q-avatar>
    </q-item-section>

    <q-item-section top>
      <q-item-label class="name text-omit">{{ world.levelName }}</q-item-label>
      <q-item-label >{{ world.versionName }}</q-item-label>
    </q-item-section>
  </q-item>
</template>

<style scoped lang="scss">
.name {
  font-size: 1.1rem;
}
</style>