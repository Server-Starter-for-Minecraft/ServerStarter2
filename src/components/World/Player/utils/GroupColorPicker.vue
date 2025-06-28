<script setup lang="ts">
import { keys, values } from 'app/src-public/scripts/obj/obj';
import { UUID } from 'app/src-electron/schema/brands';
import { PlayerGroup } from 'app/src-electron/schema/player';
import { assets } from 'src/assets/assets';
import { useSystemStore } from 'src/stores/SystemStore';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';
import { getColorLabel, old2newKey } from './groupColor';

interface Prop {
  groupId: UUID;
  group: PlayerGroup;
}
const prop = defineProps<Prop>();

const sysStore = useSystemStore();
const playerStore = usePlayerStore();

const label2code = sysStore.staticResouces.minecraftColors;

function changeColor(colorCode: string) {
  playerStore.updateGroup(prop.groupId, (g) => {
    g.color = colorCode;
    return g;
  });
}
</script>

<template>
  <div class="grid-layout">
    <q-btn
      v-for="colorLabel in keys(label2code)"
      :key="colorLabel"
      v-close-popup
      dense
      :flat="group.color !== label2code[colorLabel]"
      outline
      color="primary"
      class="q-ma-none"
      style="width: 3rem"
      @click="changeColor(label2code[colorLabel])"
    >
      <q-avatar square size="2rem">
        <q-img
          :src="
            assets.png[
              `${getColorLabel(label2code, label2code[colorLabel])}_dye`
            ]
          "
          class="avaterImg"
        />
      </q-avatar>
      <SsTooltip
        :name="old2newKey[colorLabel]"
        anchor="bottom middle"
        self="center middle"
      />
    </q-btn>
  </div>
</template>

<style scoped lang="scss">
.grid-layout {
  width: 12rem;
  display: grid;
  grid-template-columns: 3rem 3rem 3rem 3rem;
  grid-template-rows: 3rem 3rem 3rem 3rem;
}

.avaterImg {
  image-rendering: pixelated;
}
</style>
