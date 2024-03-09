<script setup lang="ts">
import { useSystemStore } from 'src/stores/SystemStore';
import { useMainStore } from 'src/stores/MainStore';
import SsInput from '../util/base/ssInput.vue';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';
interface Prop {
  expandWidth: number;
  expandDrawerBtnClickable: boolean;
}
defineProps<Prop>();

const sysStore = useSystemStore();
const mainStore = useMainStore();
</script>

<template>
  <q-item
    :clickable="expandDrawerBtnClickable"
    @click="sysStore.systemSettings.user.drawerWidth = expandWidth"
  >
    <q-item-section avatar>
      <q-icon name="search" size="2rem" class="q-py-sm" />
    </q-item-section>
    <q-item-section>
      <SsInput
        v-model="mainStore.worldSearchText"
        :label="$t('mainLayout.searchWorld')"
        :debounce="100"
      />
    </q-item-section>
    <SsTooltip
      v-if="expandDrawerBtnClickable"
      :name="$t('mainLayout.searchWorld')"
      anchor="center middle"
      self="top middle"
    />
  </q-item>
</template>
