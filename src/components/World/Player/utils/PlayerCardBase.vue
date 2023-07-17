<script setup lang="ts">
import { Player } from 'app/src-electron/schema/player';
import PlayerHeadView from './PlayerHeadView.vue';
import BaseActionsCard from '../../utils/BaseActionsCard.vue';

interface Prop {
  player: Player
  label?: string
  labelStyle?: Record<string, string>
  height?: string
  onClick: () => void
}
defineProps<Prop>()
</script>

<template>
  <BaseActionsCard
    v-if="player !== void 0"
    @click="onClick"
  >
    <template #default>
      <q-item :style="{'height': height, 'padding': '14px'}">
        <q-item-section avatar top>
          <player-head-view :player="player" size="2.5rem" />
        </q-item-section>

        <q-item-section top>
          <q-item-label class="name force-one-line">
            <slot name="title">
              {{ player.name }}
            </slot>
          </q-item-label>
          <q-item-label
            caption
            class="force-one-line"
            :style="{...labelStyle, 'opacity': '0.7'}"
          >
            {{ label }}
          </q-item-label>
        </q-item-section>

        <div class="absolute-top-right q-ma-sm">
          <slot name="rightIcon" />
        </div>
      </q-item>
    </template>

    <template #actions>
      <slot name="actions" />
    </template>
  </BaseActionsCard>
</template>

<style scoped lang="scss">
.name {
  font-size: 1.5rem;
}

.force-one-line {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>