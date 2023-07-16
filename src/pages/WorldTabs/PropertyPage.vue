<script setup lang="ts">
import { usePropertyStore } from 'src/stores/WorldTabs/PropertyStore'
import { thumbStyle } from 'src/components/World/scrollBar';
import { useSystemStore } from 'src/stores/SystemStore';
import { useMainStore } from 'src/stores/MainStore';
import { isValid } from 'src/scripts/error';
import SideMenuView from 'src/components/World/Property/SideMenuView.vue';
import SsInput from 'src/components/util/base/ssInput.vue';
import SettingsView from 'src/components/World/Property/SettingsView.vue';
import SsBtn from 'src/components/util/base/ssBtn.vue';

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
      <div class="row q-py-md">
        <SsInput
          dense
          v-model="propertyStore.searchName"
          :placeholder="$t('property.main.search')"
          class="col"
          @clear="() => propertyStore.searchName = ''"
        />
  
        <SsBtn
          dense
          :label="$t('property.main.resetAll')"
          icon="do_not_disturb_on_total_silence"
          color="red"
          width="6rem"
          @click="resetAll"
          class="q-ml-md"
        />
      </div>

      <div class="row fit" style="flex: 1 1 0;">
        <SideMenuView />

        <q-separator vertical inset />

        <div class="col">
          <q-scroll-area :thumb-style="thumbStyle" class="fit">
            <SettingsView v-model="mainStore.world.properties" />
          </q-scroll-area>
        </div>
      </div>
    </div>

    <div v-else class="justify-center row fit">
      <p style="margin: auto 0;">{{ $t('property.failed') }}</p>
    </div>
  </div>
</template>