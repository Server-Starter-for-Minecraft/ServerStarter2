<script setup lang="ts">
import SsInput from 'src/components/util/base/ssInput.vue';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';

const playerStore = usePlayerStore()
</script>

<template>
  <div>
    <span class="text-caption">登録するオーナーを検索</span>
    <SsInput
      v-model="playerStore.searchName"
      dense
      :placeholder="$t('player.search')"
      :debounce="200"
      class="q-pb-md col"
    />
  </div>
</template>