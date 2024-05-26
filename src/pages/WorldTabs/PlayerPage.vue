<script setup lang="ts">
import { isValid } from 'src/scripts/error';
import { useMainStore } from 'src/stores/MainStore';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import CardView from 'src/components/World/Player/CardView.vue';

const mainStore = useMainStore();
</script>

<template>
  <div v-if="isValid(mainStore.world.players)" class="column fit q-px-md">
    <div class="row full-height q-gutter-x-md">
      <CardView v-model="mainStore.world.players" />
    </div>
  </div>

  <div v-else class="fit" style="position: relative">
    <div class="absolute-center">
      <p>{{ $t('player.failed') }}</p>
      <SsBtn
        :label="$t('player.resetPlayerSettings')"
        color="primary"
        @click="mainStore.world.players = []"
        class="full-width"
      />
    </div>
  </div>
</template>
