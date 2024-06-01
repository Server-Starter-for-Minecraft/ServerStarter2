<script setup lang="ts">
import { keys, values } from 'app/src-public/scripts/obj/obj';
import { assets } from 'src/assets/assets';
import { useSystemStore } from 'src/stores/SystemStore';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';

interface Prop {
  groupColor: string;
  changeColor: (colorCode: string) => void;
}
defineProps<Prop>();

const sysStore = useSystemStore();

const label2code = sysStore.staticResouces.minecraftColors;
const getColorLabel = (color: string) => {
  const oldKey = keys(label2code)[values(label2code).indexOf(color)];

  // TODO: 変換コードをバックエンドに移築
  const old2newKey = {
    dark_red: 'red',
    red: 'pink',
    gold: 'orange',
    yellow: 'yellow',
    dark_green: 'green',
    green: 'lime',
    aqua: 'light_blue',
    dark_aqua: 'cyan',
    dark_blue: 'blue',
    blue: 'brown',
    light_purple: 'magenta',
    dark_purple: 'purple',
    white: 'white',
    gray: 'light_gray',
    dark_gray: 'gray',
    black: 'black',
  } as const;

  return old2newKey[oldKey];
};
</script>

<template>
  <q-btn flat dense>
    <q-avatar square size="2rem">
      <q-img
        :src="assets.png[`${getColorLabel(groupColor)}_wool`]"
        class="avaterImg"
      />
    </q-avatar>

    <q-menu>
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
                  assets.png[`${getColorLabel(label2code[colorLabel])}_dye`]
                "
                class="avaterImg"
              />
            </q-avatar>
            <SsTooltip
              :name="$t(`player.color.${colorLabel}`)"
              anchor="bottom middle"
              self="center middle"
            />
          </q-btn>
        </template>
      </div>
    </q-menu>
  </q-btn>
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
