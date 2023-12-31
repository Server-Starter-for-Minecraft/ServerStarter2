<script setup lang="ts">
import { useSystemStore } from 'src/stores/SystemStore';
import SsInput from '../util/base/ssInput.vue';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';
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
      <ss-input v-model="model" :label="$t('mainLayout.searchWorld')"/>
    </q-item-section>
    <SsTooltip
      v-if="expandDrawerBtnClickable"
      :name="$t('mainLayout.searchWorld')"
      anchor="center middle"
      self="top middle"
    />
  </q-item>
</template>