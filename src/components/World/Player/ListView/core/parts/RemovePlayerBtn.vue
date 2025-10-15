<script setup lang="ts">
import { Player } from 'app/src-electron/schema/player';
import { $T } from 'src/i18n/utils/tFunc';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';

interface Prop {
  player: Player;
}
const prop = defineProps<Prop>();

const playerStore = usePlayerStore();

function onClick() {
  if (!playerStore.focusPlayerIds.has(prop.player.uuid)) {
    playerStore.addFocus(prop.player);
  }
  playerStore.removePlayer();
}
</script>

<template>
  <q-btn
    outline
    dense
    size=".6rem"
    color="negative"
    @click.stop="onClick"
    class="q-py-xs"
  >
    <div class="row items-center q-gutter-x-sm">
      <q-icon name="close" />
      <span class="q-pr-xs gt-sm">
        {{ $T('general.delete') }}
      </span>
    </div>
    <SsTooltip :name="$T('general.delete')" class="lt-md" />
  </q-btn>
</template>
