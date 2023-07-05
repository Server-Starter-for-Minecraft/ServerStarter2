<script setup lang="ts">
import { computed } from 'vue';
import { Player } from 'app/src-electron/schema/player';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import PlayerHeadView from './PlayerHeadView.vue';

interface Prop {
  modelValue: Player
}
const prop = defineProps<Prop>()
const emit = defineEmits(['update:model-value'])

const playerStore = usePlayerStore()

const playerModel = computed({
  get() {
    return prop.modelValue;
  },
  set(newValue) {
    emit('update:model-value', newValue);
  },
})
</script>

<template>
  <q-item>
    <q-item-section avatar>
      <PlayerHeadView v-model="playerModel" />
    </q-item-section>
    <q-item-section top>
      <q-item-label class="name force-one-line">{{ playerModel.name }}</q-item-label>
      <q-item-label caption class="q-pt-xs force-one-line" style="opacity: 0.7;">uuid: {{ playerModel.uuid }}</q-item-label>
    </q-item-section>
    <q-item-section side>
      <q-btn
        outline
        rounded
        label="このプレイヤーを追加"
        icon="add"
        color="primary"
        @click="playerStore.addPlayer(playerModel)"
      />
    </q-item-section>
  </q-item>
</template>

<style scoped lang="scss">
.force-one-line {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.name {
  font-size: 1.3rem;
}
</style>