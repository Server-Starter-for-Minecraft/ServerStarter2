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

      <p class="q-pt-lg">新規ワールドの作成時などに使用するデフォルトのプロパティを設定</p>

      <SsInput
        v-model="propertyStore.searchName"
        :label="$t('property.main.search')"
        class="q-pb-md"
        @clear="() => propertyStore.searchName = ''"
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