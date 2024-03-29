<script setup lang="ts">
import { computed } from 'vue';
import { ImageURI } from 'app/src-electron/schema/brands';
import { assets } from 'src/assets/assets';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';

interface Prop {
  icon?: ImageURI;
  worldName: string;
  versionName: string;
  lastPlayed?: number;
  onClick?: () => void;
}
const props = defineProps<Prop>();

const transformedWorldName = computed(() =>
  props.worldName.replace(/§./g, '').trim()
);
</script>

<template>
  <q-item :clickable="onClick !== void 0" @click="onClick">
    <q-item-section avatar top>
      <q-avatar square size="5rem">
        <q-img :src="icon ?? assets.png.unset" class="lowImg" />
      </q-avatar>
    </q-item-section>

    <q-item-section>
      <q-item-label class="name text-omit">
        {{ transformedWorldName }}
        <SsTooltip
          :name="transformedWorldName"
          anchor="bottom start"
          self="center start"
        />
      </q-item-label>
      <q-item-label class="version">{{ versionName }}</q-item-label>
      <q-item-label v-if="lastPlayed" class="date">
        {{
          $t('mainLayout.customMapImporter.lastPlayed', {
            datetime: $d(lastPlayed, 'dateTime'),
          })
        }}
      </q-item-label>
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
  opacity: 0.6;
}

.date {
  font-size: 0.75rem;
  opacity: 0.6;
}
</style>
