<script setup lang="ts">
import { useSystemStore } from 'src/stores/SystemStore';
import SsInput from '../util/base/ssInput.vue';

interface Prop {
  expandDrawerBtnClickable: boolean
}
const model = defineModel<string | number>()
defineProps<Prop>()

const sysStore = useSystemStore()
</script>

<template>
  <q-item
    :clickable="expandDrawerBtnClickable"
    @click="sysStore.systemSettings.user.drawerWidth = 300"
  >
    <q-item-section avatar>
      <q-icon name="search" size="2rem" class="q-py-sm"/>
    </q-item-section>
    <q-item-section>
      <ss-input v-model="model" :label="$t('worldList.searchWorld')"/>
    </q-item-section>
    <q-tooltip
      v-if="expandDrawerBtnClickable"
      anchor="center middle"
      self="top middle"
      :delay="500"
    >
      ワールドを検索
    </q-tooltip>
  </q-item>
</template>