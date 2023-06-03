<script setup lang="ts">
import { usePropertyStore } from 'src/stores/WorldTabsStore';
import { thumbStyle } from 'src/components/World/scrollBar';
import SideMenuView from 'src/components/World/Property/SideMenuView.vue';
import SsInput from 'src/components/util/base/ssInput.vue';
import SettingsView from 'src/components/World/Property/SettingsView.vue';

const propertyStore = usePropertyStore()
</script>

<template>
  <div class="mainField">
    <div class="column fit">
      <SsInput
        v-model="propertyStore.searchName"
        label="プロパティを検索"
        class="q-py-md"
        @clear="() => propertyStore.searchName = ''"
      />
  
      <div class="row fit" style="flex: 1 1 0;">
        <SideMenuView/>
        
        <q-separator vertical inset/>

        <div class="col">
          <q-scroll-area
            :thumb-style="thumbStyle"
            class="fit"
          >
            <SettingsView/>
          </q-scroll-area>
        </div>
      </div>
    </div>
  </div>
</template>