<script setup lang="ts">
import BaseActionsCard from '../utils/BaseActionsCard.vue';
import CardBtn from './CardBtn.vue';

interface Prop {
  name: string
  desc?: string
  actionType?: 'delete' | 'add'
  color?: string
  onClick?: () => void
}
defineProps<Prop>()
</script>

<template>
  <BaseActionsCard @click="onClick" :style="{'background-color': color}">
    <template #default>
      <!-- TODO: heightの定数指定を解消 -->
      <q-item class="q-pt-md" style="height: 5rem; padding-right: 2rem;">
        <q-item-section top>
          <q-item-label class="contentsName text-omit">{{ name }}</q-item-label>
          <q-item-label v-if="desc !== void 0" class="text-omit" style="opacity: .7;">
            {{ desc }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </template>

    <template #actions>
      <div v-if="actionType !== void 0" class="absolute-bottom-right">
        <CardBtn v-if="actionType === 'delete'" icon="delete" />
        <CardBtn v-else-if="actionType === 'add'" icon="add" />
      </div>
    </template>
  </BaseActionsCard>
</template>

<style scoped lang="scss">
.contentsName {
  font-size: 1.5rem;
}
</style>