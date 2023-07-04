<script setup lang="ts">
import { ref } from 'vue';
import { Player } from 'app/src-electron/schema/player';
import SearchResultItem from './SearchResultItem.vue';

interface Prop {
  player: Player
}
const prop = defineProps<Prop>()

const playerModel = ref(prop.player)
</script>

<template>
  <SearchResultItem v-model="playerModel" />
</template>