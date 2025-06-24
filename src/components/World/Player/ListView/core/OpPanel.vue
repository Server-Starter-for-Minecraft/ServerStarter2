<script setup lang="ts">
import { ref } from 'vue';
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { OpLevel } from 'app/src-electron/schema/player';
import { assets } from 'src/assets/assets';
import { $T } from 'src/i18n/utils/tFunc';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';
import OpLevelBtn from '../../utils/OpLevelBtn.vue';
import { isValidBtn, setOp } from '../../utils/playerOp';

interface Prop {
  uuid: PlayerUUID;
  playerOpLevel?: OpLevel;
}
const prop = defineProps<Prop>();

const playerStore = usePlayerStore();
const showMenu = ref(false);

const showingLevel = (level?: OpLevel) =>
  level !== void 0 ? $T('player.opLevel') + level : $T('player.noOp');

function onClick() {
  if (!playerStore.focusCards.has(prop.uuid)) {
    playerStore.addFocus(prop.uuid);
  }
  showMenu.value = true;
}
</script>

<template>
  <q-btn dense flat @click.stop="onClick()">
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

    <SsTooltip :name="showingLevel(playerOpLevel)" class="lt-md" />
  </q-btn>

  <q-menu v-model="showMenu" auto-close>
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
</template>
