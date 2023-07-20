<script setup lang="ts">
import { thumbStyle } from 'src/components/World/scrollBar';
import { useSystemStore } from 'src/stores/SystemStore';
import { usePropertyStore } from 'src/stores/WorldTabs/PropertyStore'
import SideMenuView from 'src/components/World/Property/SideMenuView.vue';
import SsInput from 'src/components/util/base/ssInput.vue';
import SettingsView from 'src/components/World/Property/SettingsView.vue';

const sysStore = useSystemStore()
const propertyStore = usePropertyStore()
</script>

<template>
  <div class="mainField">
    <div class="column fit">

      <p class="q-my-sm text-body2" style="opacity: .5;">{{ $t("systemsetting.property.description")}}</p>

      <SsInput
        dense
        v-model="propertyStore.searchName"
        :placeholder="$t('systemsetting.property.search')"
        class="q-pb-md"
      />
  
      <div class="row fit" style="flex: 1 1 0;">
        <SideMenuView />

        <q-separator vertical inset />

        <div class="col">
          <q-scroll-area
            :thumb-style="thumbStyle"
            class="fit"
          >
            <SettingsView v-model="sysStore.systemSettings().world.properties" />
          </q-scroll-area>
        </div>
      </div>
    </div>
  </div>
</template>