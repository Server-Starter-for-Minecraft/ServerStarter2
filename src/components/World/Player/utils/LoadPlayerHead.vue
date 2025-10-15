<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { Player } from 'app/src-electron/schema/player';
import { checkError } from 'src/components/Error/Error';
import PlayerHeadAvatar from 'src/components/util/PlayerHeadAvatar.vue';

interface Prop {
  pid: PlayerUUID;
  size: string;
}
const prop = defineProps<Prop>();

const loadedPlayer = ref<Player | undefined>(undefined);

onMounted(async () => {
  const player = await window.API.invokeGetPlayer(prop.pid, 'uuid');
  checkError(
    player,
    (p) => {
      loadedPlayer.value = p;
    },
    undefined
  );
});
</script>

<template>
  <PlayerHeadAvatar v-if="loadedPlayer" :player="loadedPlayer" :size="size" />
  <q-skeleton v-else type="rect" :style="{ height: size, width: size }" />
</template>
