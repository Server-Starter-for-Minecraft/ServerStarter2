<script setup lang="ts">
import { usePropertyStore } from 'src/stores/WorldTabsStore';
import { thumbStyle } from 'src/components/World/scrollBar';
import { useSystemStore } from 'src/stores/SystemStore';
import { useMainStore } from 'src/stores/MainStore';
import { isValid } from 'src/scripts/error';
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
    if (isValid(mainStore.world.properties)) {
      mainStore.world.properties[key] = sysStore.systemSettings().world.properties[key]
    }
  })
}
</script>

<template>
  <div class="mainField">
    <div v-if="isValid(mainStore.world.properties)" class="column fit">
      <div class="row">
        <SsInput
          v-model="propertyStore.searchName"
          :label="$t('property.main.search')"
          class="q-py-md col"
          @clear="() => propertyStore.searchName = ''"
        />
  
        <q-btn
          dense
          icon="do_not_disturb_on_total_silence"
          :label="$t('property.main.resetAll')"
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
            <SettingsView v-model="mainStore.world.properties"/>
          </q-scroll-area>
        </div>
      </div>
    </div>

    <!-- TODO: 画面の調整 -->
    <div v-else>
      Propertyが読み込めませんでした
    </div>
  </div>
</template>