<script setup lang="ts">
import { useMainStore } from 'src/stores/MainStore';
import BaseActionsCard from '../utils/BaseActionsCard.vue';

interface Prop {
  contentType: 'datapack' | 'plugin' | 'mod'
  name: string
  desc?: string
  isDelete?: boolean
  color?: string
}
defineProps<Prop>()

const mainStore = useMainStore()

function addContent() {
}

function deleteContent() {

}
</script>

<template>
  <BaseActionsCard
    :style="{
      'border-radius': '6px',
      'background-color': color
    }"
  >
    <template #default>
      <q-item class="q-pr-sm">
        <q-item-section>
          <q-item-label class="contentsName text-omit">{{ name }}</q-item-label>
          <q-item-label v-if="desc !== void 0" class="text-omit" style="opacity: .7;">
            {{ desc }}
          </q-item-label>
        </q-item-section>

        <q-item-section v-if="isDelete" side>
          <q-btn
            dense
            flat
            stack
            color="red"
            icon="close"
            size="1rem"
          >
            <div class="text-red text-center full-width" style="font-size: .8rem;">削除</div>
          </q-btn>
        </q-item-section>
        <q-item-section v-else side>
          <q-btn
            dense
            flat
            stack
            color="primary"
            icon="add"
            size="1rem"
            class="q-pa-none"
          >
            <div class="text-primary text-center full-width" style="font-size: .8rem;">導入</div>
          </q-btn>
        </q-item-section>
      </q-item>
    </template>
  </BaseActionsCard>
</template>

<style scoped lang="scss">
.contentsName {
  font-size: 1.5rem;
}
</style>