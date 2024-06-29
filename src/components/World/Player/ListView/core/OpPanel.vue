<script setup lang="ts">
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { OpLevel } from 'app/src-electron/schema/player';
import { assets } from 'src/assets/assets';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';

interface Prop {
  uuid: PlayerUUID;
  playerOpLevel?: OpLevel;
}
const prop = defineProps<Prop>();

const playerStore = usePlayerStore();

const isClickable = () => {
  return playerStore.focusCards.size > 0
    ? playerStore.focusCards.has(prop.uuid)
    : true;
};

function onClick(opLevel: 0 | OpLevel) {
  playerStore.addFocus(prop.uuid);
  playerStore.setOP(opLevel);
}
</script>

<template>
  <div class="row items-center">
    <template v-for="opLevel in ([0, 1, 2, 3, 4] as const)" :key="opLevel">
      <q-btn
        dense
        flat
        :disable="!isClickable()"
        @click.stop="() => onClick(opLevel)"
      >
        <q-avatar v-if="(playerOpLevel ?? 0) === opLevel" size="2rem">
          <q-icon size="1.8rem" :name="assets.svg[`level${opLevel}`]()" />
        </q-avatar>

        <q-avatar v-else size="2rem">
          <q-icon
            size="1.8rem"
            :name="assets.svg['no_level']($q.dark.isActive ? 'white' : 'black')"
          />
        </q-avatar>
      </q-btn>
    </template>

    <span class="gt-sm q-ml-sm" style="width: 4rem">
      {{
        playerOpLevel !== void 0
          ? $t('player.opLevel') + playerOpLevel
          : $t('player.noOp')
      }}
    </span>
  </div>
</template>
