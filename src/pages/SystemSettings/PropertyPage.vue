<script setup lang="ts">
import { ref } from 'vue';
import { useSystemStore } from 'src/stores/SystemStore';
import { usePropertyStore } from 'src/stores/WorldTabs/PropertyStore';
import { thumbStyle } from 'src/components/World/scrollBar';
import SsInput from 'src/components/util/base/ssInput.vue';
import SettingsView from 'src/components/World/Property/SettingsView.vue';
import SideMenuView from 'src/components/World/Property/SideMenuView.vue';

const sysStore = useSystemStore();
const propertyStore = usePropertyStore();

// 入力領域のスクロールバーの制御
const scrollAreaRef = ref();

/**
 * 画面を一番上に遷移
 */
function scrollTop() {
  scrollAreaRef.value.setScrollPosition('vertical', 0);
}
</script>

<template>
  <div class="mainField">
    <div class="column fit">
      <p class="q-my-sm text-body2" style="opacity: 0.5">
        {{ $t('systemsetting.property.description') }}
      </p>

      <SsInput
        dense
        v-model="propertyStore.searchName"
        :placeholder="$t('systemsetting.property.search')"
        class="q-pb-md"
      />

      <div class="row fit" style="flex: 1 1 0">
        <SideMenuView @scroll-top="scrollTop" />

        <q-separator vertical inset />

        <div class="col">
          <q-scroll-area
            ref="scrollAreaRef"
            :thumb-style="thumbStyle"
            class="fit"
          >
            <SettingsView v-model="sysStore.systemSettings.world.properties" />
          </q-scroll-area>
        </div>
      </div>
    </div>
  </div>
</template>
