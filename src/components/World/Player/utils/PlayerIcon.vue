<script setup lang="ts">
import { onBeforeMount, Ref, ref } from 'vue';
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { Player } from 'app/src-electron/schema/player';
import { checkError } from 'src/components/Error/Error';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';
import PlayerHeadAvatar from 'src/components/util/PlayerHeadAvatar.vue';

interface Prop {
  uuid: PlayerUUID;
  negativeBtnClicked?: (uuid: PlayerUUID) => void;
  showName?: boolean;
  // ホバー時のみボタンが表示されるようになる
  hoverBtn?: boolean;
  // ボタンのサイズ
  headSize?: string;
  iconSize?: string;
  // tooltipにプレイヤー名を表示するか
  enableTooltip?: boolean;
}
const prop = defineProps<Prop>();

const hovered = ref(false);
const player: Ref<undefined | Player> = ref(undefined);

// プレイヤーデータをAPIから取得
onBeforeMount(async () => {
  if (player.value === void 0) {
    checkError(
      await window.API.invokeGetPlayer(prop.uuid, 'uuid'),
      (p) => {
        player.value = p;
      },
      undefined
    );
  }
});
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
        @click.stop="negativeBtnClicked?.(uuid)"
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
