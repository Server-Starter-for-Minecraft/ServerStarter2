<script setup lang="ts">
import { WorldEdited } from 'app/src-electron/schema/world';
import { assets } from 'src/assets/assets';

interface Prop {
  active?: boolean;
  world: WorldEdited;
  onClicked: (world: WorldEdited) => void;
}
defineProps<Prop>();
</script>

<template>
  <q-item
    clickable
    :active="active"
    @click="onClicked(world)"
    active-class="activeItem"
    style="width: 15rem"
  >
    <q-item-section avatar>
      <q-img
        :src="world.avater_path ?? assets.png.unset"
        :ratio="1"
        style="image-rendering: pixelated"
      />
    </q-item-section>
    <q-item-section>
      <q-item-label lines="1">{{ world.name }}</q-item-label>
      <q-item-label v-if="world.last_date" caption lines="1">
        {{
          $t('mainLayout.customMapImporter.lastPlayed', {
            datetime: $d(world.last_date, 'dateTime'),
          })
        }}
      </q-item-label>
    </q-item-section>
  </q-item>
</template>

<style scoped lang="scss">
.activeItem {
  border-left: 3px solid;
}
</style>
