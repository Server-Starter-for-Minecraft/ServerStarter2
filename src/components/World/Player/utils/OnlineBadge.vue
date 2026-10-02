<!-- 表示中のワールドのサーバーにプレイヤーが参加中の場合に表示するバッジ -->
<script setup lang="ts">
import { computed } from 'vue';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';

interface Prop {
  /** 参加中か否かを判定するプレイヤー名 */
  playerName: string;
}
const prop = defineProps<Prop>();

const mainStore = useMainStore();
const consoleStore = useConsoleStore();

const isOnline = computed(() =>
  consoleStore.isOnlinePlayer(mainStore.selectedWorldID, prop.playerName)
);
</script>

<template>
  <q-badge
    v-if="isOnline"
    rounded
    color="primary"
    class="online-badge"
    :aria-label="$t('player.online')"
  >
    <SsTooltip :name="$t('player.online')" />
  </q-badge>
</template>

<style scoped lang="scss">
.online-badge {
  flex-shrink: 0;
  width: 0.5rem;
  height: 0.5rem;
  min-height: 0;
  padding: 0;
}
</style>
