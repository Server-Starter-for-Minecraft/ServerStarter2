<script setup lang="ts">
import { ImageURI } from 'app/src-electron/schema/brands';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';

interface Prop {
  icon?: ImageURI,
  worldName: string,
  versionName: string,
  onClick?: () => void
}
const props = defineProps<Prop>()

const transformedWorldName = props.worldName.replace(/§./g, "").trim()

</script>

<template>
  <q-item
    :clickable="onClick !== void 0"
    @click="onClick"
  >
    <q-item-section avatar top>
      <q-avatar square size="5rem">
        <q-img :src="icon" class="lowImg" />
      </q-avatar>
    </q-item-section>

    <q-item-section>
      <q-item-label class="name text-omit">
        {{ transformedWorldName }}
        <SsTooltip :name="transformedWorldName" anchor="bottom start" self="center start" />
      </q-item-label>
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