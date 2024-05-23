<script setup lang="ts">
import { Player } from 'app/src-electron/schema/player';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';
import PlayerHeadView from 'src/components/World/Player/utils/PlayerHeadView.vue';

const player = defineModel<Player | undefined>({ required: true });
</script>

<template>
  <q-card flat style="max-width: 25rem" class="q-pa-sm">
    <q-item v-if="player !== void 0">
      <q-item-section avatar>
        <PlayerHeadView :player="player" size="2.5rem" />
      </q-item-section>

      <q-item-section>
        <q-item-label class="name text-omit">
          {{ player.name }}
          <SsTooltip
            :name="player.name"
            anchor="bottom start"
            self="center start"
          />
        </q-item-label>
        <q-item-label class="text-caption text-omit" style="opacity: 0.7">
          {{ player.uuid }}
          <SsTooltip
            :name="player.uuid"
            anchor="bottom start"
            self="center start"
          />
        </q-item-label>
      </q-item-section>
    </q-item>

    <q-card-section v-else>
      <p class="message">{{ $t('owner.noOwner') }}</p>
    </q-card-section>
  </q-card>
</template>

<style scoped lang="scss">
.name {
  font-size: 1rem;
}

.message {
  margin-top: 15px;
  margin-bottom: 15px;
  font-size: 0.9rem;
  opacity: 0.6;
}
</style>
