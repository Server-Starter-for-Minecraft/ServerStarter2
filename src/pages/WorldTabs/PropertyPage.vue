<script setup lang="ts">
import { ServerProperties } from 'app/src-electron/schema/serverproperty';
import { isValid } from 'src/scripts/error';
import { fromEntries, toEntries } from 'src/scripts/obj';
import { thumbStyle } from 'src/components/World/scrollBar';
import { usePropertyStore } from 'src/stores/WorldTabs/PropertyStore'
import { useSystemStore } from 'src/stores/SystemStore';
import { useMainStore } from 'src/stores/MainStore';
import SideMenuView from 'src/components/World/Property/SideMenuView.vue';
import SsInput from 'src/components/util/base/ssInput.vue';
import SettingsView from 'src/components/World/Property/SettingsView.vue';
import SsBtn from 'src/components/util/base/ssBtn.vue';

const sysStore = useSystemStore()
const mainStore = useMainStore()
const propertyStore = usePropertyStore()

// システムが規定するデフォルトプロパティ
const initProperty: ServerProperties = fromEntries(toEntries(sysStore.staticResouces.properties).map(keyVal =>[keyVal[0], keyVal[1].default]))

/**
 * 全てのServer Propertyを基本設定に戻す
 */
function resetAll() {
  Object.keys(sysStore.systemSettings.world.properties).map(key => {
    if (isValid(mainStore.world.properties)) {
      mainStore.world.properties[key] = sysStore.systemSettings.world.properties[key]
    }
  })
}
</script>

<template>
  <div class="mainField">
    <div v-if="isValid(mainStore.world.properties)" class="column fit">
      <div class="row q-py-md">
        <SsInput dense v-model="propertyStore.searchName" :placeholder="$t('property.main.search')" class="col" />

        <SsBtn dense :label="$t('property.main.resetAll')" icon="do_not_disturb_on_total_silence" color="red" width="6rem"
          @click="resetAll" class="q-ml-md" />
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

    <div v-else class="fit" style="position: relative;">
      <div class="absolute-center">
        <p>{{ $t('property.failed') }}</p>
        <SsBtn :label="$t('property.reset')" color="primary" @click="mainStore.world.properties = initProperty"
          class="full-width" />
      </div>
    </div>
  </div>
</template>