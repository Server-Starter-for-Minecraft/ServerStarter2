<script setup lang="ts">
import { useSystemStore } from 'src/stores/SystemStore';
import { useMainStore } from 'src/stores/MainStore';
import { keys, values } from 'src/scripts/obj';
import SsInput from '../util/base/ssInput.vue';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';
interface Prop {
  expandWidth: number;
  expandDrawerBtnClickable: boolean;
}
defineProps<Prop>();

const sysStore = useSystemStore();
const mainStore = useMainStore();

/**
 * 選択中のワールドが検索によって消滅した場合に，表示中のワールドを割り当てる
 */
function updateSelectedWorld() {
  const wList = mainStore.showingWorldList;
  const wListKeys = keys(wList)
  if (!wListKeys.includes(mainStore.world.id) && wListKeys.length > 0) {
    mainStore.setWorld(values(wList).reverse()[0]);
  }
}
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
        @update:model-value="updateSelectedWorld"
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
