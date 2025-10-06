<script setup lang="ts">
import { ref } from 'vue';
import { Player } from 'app/src-electron/schema/player';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';
import PlayerHeadAvatar from 'src/components/util/PlayerHeadAvatar.vue';

interface Prop {
  player: Player;
  negativeBtnClicked?: (uuid: Player) => void;
  showName?: boolean;
  // ホバー時のみボタンが表示されるようになる
  hoverBtn?: boolean;
  // ボタンのサイズ
  headSize?: string;
  iconSize?: string;
  // tooltipにプレイヤー名を表示するか
  enableTooltip?: boolean;
}
defineProps<Prop>();

const hovered = ref(false);
</script>

<template>
  <q-item
    v-if="player !== void 0"
    dense
    @mouseover="hovered = true"
    @mouseleave="hovered = false"
    class="q-px-none"
    style="margin: 0 auto"
  >
    <q-item-section>
      <q-btn
        flat
        dense
        @click.stop="negativeBtnClicked?.(player)"
        class="q-pa-none"
        :style="negativeBtnClicked ? '' : { 'pointer-events': 'none' }"
        style="max-width: fit-content"
      >
        <PlayerHeadAvatar :player="player" :size="headSize ?? '1.5rem'" />
        <q-icon
          v-show="hoverBtn && hovered"
          name="cancel"
          class="absolute-center"
          :size="iconSize ?? '2rem'"
          color="negative"
        />
      </q-btn>

      <q-item-label v-if="showName" class="text-center q-pt-xs text-omit">
        {{ player.name }}
      </q-item-label>
    </q-item-section>
    <SsTooltip
      v-if="enableTooltip"
      :name="player.name"
      anchor="bottom middle"
      self="center middle"
    />
  </q-item>
</template>
