<script setup lang="ts">
import { usePropertyStore } from 'src/stores/WorldTabs/PropertyStore'
import { thumbStyle } from '../scrollBar';

const propertyStore = usePropertyStore()

function groupClicked(selectedGroupName: string) {
  propertyStore.selectTab = selectedGroupName
}
</script>

<template>
  <div style="width: 170px;">
    <q-scroll-area :thumb-style="thumbStyle" class="fit">
      <template v-for="groupKey in propertyStore.propertyTabs()" :key="groupKey">
        <q-item clickable :active="propertyStore.selectPropertyTab(groupKey)" @click="() => groupClicked(groupKey)">
          <q-item-section style="width: max-content;">{{ $t(`property.group.${groupKey}`) }}</q-item-section>
        </q-item>
      </template>
    </q-scroll-area>
  </div>
</template>