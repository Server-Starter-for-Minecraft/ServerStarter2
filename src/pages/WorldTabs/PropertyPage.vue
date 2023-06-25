<script setup lang="ts">
import { usePropertyStore } from 'src/stores/WorldTabsStore';
import { thumbStyle } from 'src/components/World/scrollBar';
import { useSystemStore } from 'src/stores/SystemStore';
import { useMainStore } from 'src/stores/MainStore';
import SideMenuView from 'src/components/World/Property/SideMenuView.vue';
import SsInput from 'src/components/util/base/ssInput.vue';
import SettingsView from 'src/components/World/Property/SettingsView.vue';

const sysStore = useSystemStore()
const mainStore = useMainStore()
const propertyStore = usePropertyStore()

/**
 * 全てのServer Propertyを基本設定に戻す
 */
function resetAll() {
  Object.keys(sysStore.systemSettings().world.properties).map(key => {
    mainStore.world().properties[key] = sysStore.systemSettings().world.properties[key].value
  })
}
</script>

<template>
  <div class="mainField">
    <div class="column fit">
      <div class="row">
        <SsInput
          v-model="propertyStore.searchName"
          label="プロパティを検索"
          class="q-py-md col"
          @clear="() => propertyStore.searchName = ''"
        />
  
        <q-btn
          dense
          icon="do_not_disturb_on_total_silence"
          label="全て戻す"
          color="red"
          class="q-my-lg q-ml-lg q-pa-sm"
          style="font-size: 1rem;"
          @click="resetAll"
        />
      </div>
  
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