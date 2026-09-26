<script setup lang="ts">
import { QMenuProps } from 'quasar';
import { keys } from 'app/src-public/scripts/obj/obj';
import { assets } from 'src/assets/assets';
import { useSystemStore } from 'src/stores/SystemStore';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';
import { getColorLabel, old2newKey } from './groupColor';

interface Prop {
  groupColor: string;
  changeColor: (colorCode: string) => void;
  self?: QMenuProps['self'];
  anchor?: QMenuProps['anchor'];
  offset?: QMenuProps['offset'];
}
defineProps<Prop>();

const sysStore = useSystemStore();
const label2code = sysStore.staticResouces.minecraftColors;
</script>

<template>
  <q-menu :self="self" :anchor="anchor" :offset="offset">
    <div class="grid-layout">
      <template v-for="colorLabel in keys(label2code)" :key="colorLabel">
        <q-btn
          v-close-popup
          dense
          :flat="groupColor !== label2code[colorLabel]"
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
      </template>
    </div>
  </q-menu>
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
