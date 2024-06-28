<script setup lang="ts">
import { keys } from 'app/src-public/scripts/obj/obj';
import { useMainStore } from 'src/stores/MainStore';
import { useSystemStore } from 'src/stores/SystemStore';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';
import SsInput from '../util/base/ssInput.vue';

interface Prop {
  expandWidth: number;
  expandDrawerBtnClickable: boolean;
}
defineProps<Prop>();

const sysStore = useSystemStore();
const mainStore = useMainStore();

function onUpdateInput(newText: string) {
  // 選択中のワールドがリスト圏外になった場合は選択を解除
  if (
    !keys(mainStore.allWorlds.filteredWorlds(newText)).includes(
      mainStore.selectedWorldID
    )
  ) {
    mainStore.unsetWorld();
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
        @update:model-value="
          (newVal) => onUpdateInput(newVal?.toString() ?? '')
        "
        @clear="() => (mainStore.worldSearchText = '')"
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
