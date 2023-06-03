<script setup lang="ts">
import { usePropertyStore } from 'src/stores/WorldTabsStore';
import { thumbStyle } from '../scrollBar';

const propertyStore = usePropertyStore()

function groupClicked(selectedGroupName: string) {
  propertyStore.selectTab = selectedGroupName
}
</script>

<template>
  <div style="width: 170px;">
    <q-scroll-area
      :thumb-style="thumbStyle"
      class="fit"
    >
      <template v-for="group in propertyStore.propertyTabs()" :key="group">
        <q-item
          clickable
          :active="propertyStore.selectPropertyTab(group.name)"
          @click="() => groupClicked(group.name)"
        >
          <q-item-section style="width: max-content;">{{ group.label }}</q-item-section>
        </q-item>
      </template>
    </q-scroll-area>
  </div>
</template>