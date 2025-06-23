<script setup lang="ts">
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { OpLevel } from 'app/src-electron/schema/player';
import { assets } from 'src/assets/assets';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import OpLevelBtn from '../../utils/OpLevelBtn.vue';
import { isValidBtn, setOp } from '../../utils/playerOp';

interface Prop {
  uuid: PlayerUUID;
  playerOpLevel?: OpLevel;
}
const prop = defineProps<Prop>();

const playerStore = usePlayerStore();

function onClick() {
  if (playerStore.focusCards.has(prop.uuid)) {
    playerStore.addFocus(prop.uuid);
  }
}
</script>

<template>
  <!-- TODO: フォーカスされた要素のOPボタンをクリックすると，プレイヤーのフォーカスが外れる問題を修正 -->
  <q-btn dense flat @click="onClick">
    <div class="row items-center q-gutter-x-sm">
      <q-icon
        size="1.3rem"
        :name="assets.svg[`level${playerOpLevel ?? 0}`]()"
      />
      <span class="gt-sm" style="width: 4rem">
        {{
          playerOpLevel !== void 0
            ? $t('player.opLevel') + playerOpLevel
            : $t('player.noOp')
        }}
      </span>
    </div>

    <q-menu>
      <q-list class="q-py-sm" style="width: max-content">
        <OpLevelBtn
          v-for="opLevel in ([4, 3, 2, 1, 0] as const)"
          :key="opLevel"
          :src="assets.svg[`level${opLevel}`]()"
          :label="
            opLevel !== 0 ? $t('player.opLevel') + opLevel : $t('player.noOp')
          "
          :disable="!isValidBtn(opLevel)"
          @click="() => setOp(opLevel)"
        />
      </q-list>
    </q-menu>
    <q-tooltip class="lt-md" >
      {{
        playerOpLevel !== void 0
          ? $t('player.opLevel') + playerOpLevel
          : $t('player.noOp')
      }}
    </q-tooltip>
  </q-btn>
</template>
