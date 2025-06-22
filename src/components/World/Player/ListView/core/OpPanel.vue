<script setup lang="ts">
import { ref } from 'vue';
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { OpLevel } from 'app/src-electron/schema/player';
import { assets } from 'src/assets/assets';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import { isValidBtn, setOP } from 'src/components/World/utils/playerOp';
import OpLevelBtn from '../../utils/OpLevelBtn.vue';

interface Prop {
  uuid: PlayerUUID;
  playerOpLevel?: OpLevel;
}
const prop = defineProps<Prop>();
const opLevelRef = ref(prop.playerOpLevel ?? 0);

const playerStore = usePlayerStore();

function onClick(opLevel: 0 | OpLevel) {
  playerStore.addFocus(prop.uuid);
  playerStore.setOP(opLevel);
}
</script>

<template>
  <q-select
    v-model="opLevelRef"
    @update:model-value="(level) => onClick(level)"
    dense
    :options="([0, 1, 2, 3, 4] as const)"
    options-selected-class="text-primary"
    style="width: 8rem;"
    class="text-caption"
  >
    <template v-slot:selected-item="scope">
      <div class="row items-center q-gutter-sm">
        <q-avatar size="1.5rem">
          <q-icon
            size="1.3rem"
            :name="assets.svg[`level${scope.opt}`]()"
            :color="scope.opt > 0 ? 'white' : 'grey-7'"
          />
        </q-avatar>
        <span class="text-weight-medium">
          {{
            scope.opt !== 0
              ? $t('player.opLevel') + scope.opt
              : $t('player.noOp')
          }}
        </span>
      </div>
    </template>

    <template v-slot:option="scope">
      <OpLevelBtn
        :src="assets.svg[`level${scope.opt}`]()"
        :label="
          scope.opt !== 0 ? $t('player.opLevel') + scope.opt : $t('player.noOp')
        "
        :disable="!isValidBtn(scope.opt)"
        @click="() => setOP(scope.opt)"
      />
    </template>
  </q-select>
</template>
