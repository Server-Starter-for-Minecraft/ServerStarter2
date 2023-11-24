<script setup lang="ts">
import { ImageURI } from 'app/src-electron/schema/brands';
import { assets } from 'src/assets/assets';

interface Prop {
  icon?: ImageURI,
  worldName: string,
  versionName: string,
  onClick?: () => void
}
defineProps<Prop>()
</script>

<template>
  <q-item
    :clickable="onClick !== void 0"
    @click="onClick"
  >
    <q-item-section avatar top>
      <q-avatar square size="5rem">
        <q-img :src="icon ?? assets.png.unset" class="lowImg" />
      </q-avatar>
    </q-item-section>

    <q-item-section>
      <q-item-label class="name text-omit">{{ worldName.replace(/§./g, "").trim() }}</q-item-label>
      <q-item-label class="version">{{ versionName }}</q-item-label>
    </q-item-section>
  </q-item>
</template>

<style scoped lang="scss">
.lowImg {
  image-rendering: pixelated;
}

.name {
  font-size: 1.3rem;
}

.version {
  font-size: 1rem;
  opacity: .6;
}
</style>