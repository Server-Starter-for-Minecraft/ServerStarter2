<script setup lang="ts">
import { Ref, onMounted, ref, watch } from 'vue';
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { Player } from 'app/src-electron/schema/player';
import { checkError } from 'src/components/Error/Error';
import PlayerHeadView from 'src/components/World/Player/utils/PlayerHeadView.vue';
import { tError } from 'src/i18n/utils/tFunc';

const owner = defineModel<PlayerUUID>()

const player: Ref<Player> = ref({} as Player)

onMounted(updatePlayer)
watch(owner, updatePlayer)

async function updatePlayer() {
  if (owner.value) {
    const res = await window.API.invokeGetPlayer(owner.value, 'uuid')
    checkError(
      res,
      p => player.value = p,
      e => tError(e)
      //() => { return { title: 'オーナープレイヤーの取得に失敗しました' }}
    )
  }
}
</script>

<template>
  <q-card flat style="max-width: 25rem;" class="q-pa-sm">
    <q-item v-if="owner !== void 0">
      <q-item-section avatar>
        <PlayerHeadView :player="player" size="2.5rem" />
      </q-item-section>

      <q-item-section>
        <q-item-label class="name text-omit">{{ player.name }}</q-item-label>
        <q-item-label class="text-caption text-omit" style="opacity: 0.7;">{{ player.uuid }}</q-item-label>
      </q-item-section>
    </q-item>

    <q-card-section v-else>
      <p class="message ">{{ $t('owner.noOwner') }}</p>
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
  font-size: .9rem;
  opacity: .6;
}
</style>