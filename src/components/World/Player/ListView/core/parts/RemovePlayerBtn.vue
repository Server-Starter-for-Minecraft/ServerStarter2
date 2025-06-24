<script setup lang="ts">
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { $T } from 'src/i18n/utils/tFunc';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';
import { removePlayer } from '../../../utils/playerOp';

interface Prop {
  uuid: PlayerUUID;
}
const prop = defineProps<Prop>();

const playerStore = usePlayerStore();

function onClick() {
  if (!playerStore.focusCards.has(prop.uuid)) {
    playerStore.addFocus(prop.uuid);
  }
  removePlayer();
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
