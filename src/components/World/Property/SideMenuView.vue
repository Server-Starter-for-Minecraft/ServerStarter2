<script setup lang="ts">
import { keys } from 'src/scripts/obj';
import { usePropertyStore } from 'src/stores/WorldTabs/PropertyStore';
import {
  pGroupKey,
  propertyClasses,
} from 'src/components/World/Property/classifications';
import { thumbStyle } from '../scrollBar';

interface Prop {
  onScrollTop: () => void;
}
const prop = defineProps<Prop>();

const propertyStore = usePropertyStore();

function groupClicked(selectedGroupName: pGroupKey) {
  propertyStore.selectTab = selectedGroupName;
  prop.onScrollTop();
}
</script>

<template>
  <div style="width: 170px">
    <q-scroll-area
      v-if="propertyStore.searchName === ''"
      :thumb-style="thumbStyle"
      class="fit"
    >
      <template v-for="groupKey in keys(propertyClasses)" :key="groupKey">
        <q-item
          clickable
          :active="propertyStore.selectPropertyTab(groupKey)"
          @click="() => groupClicked(groupKey)"
        >
          <q-item-section style="width: max-content">{{
            $t(`property.group.${groupKey}`)
          }}</q-item-section>
        </q-item>
      </template>
    </q-scroll-area>

    <q-item v-else active>
      <q-item-section style="width: max-content">{{
        $t('property.result')
      }}</q-item-section>
    </q-item>
  </div>
</template>
