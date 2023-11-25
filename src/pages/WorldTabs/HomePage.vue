<script setup lang="ts">
import { ref } from 'vue';
import { setScrollTop } from 'src/components/World/HOME/scroll';
import ExpansionView from 'src/components/World/HOME/expansionView.vue';
import WorldIconView from 'src/components/World/HOME/Top/WorldIconView.vue';
import WorldFolderView from 'src/components/World/HOME/OtherSettings/WorldFolderView.vue';
import BootSettingsView from 'src/components/World/HOME/OtherSettings/BootSettingsView.vue';
import WorldDeleteView from 'src/components/World/HOME/WorldOperation/WorldDeleteView.vue';
import WorldNameView from 'src/components/World/HOME/Top/WorldNameView.vue';
import VersionSelecterView from 'src/components/World/HOME/Top/VersionSelecterView.vue';
import BackupWorldView from 'src/components/World/HOME/WorldOperation/BackupWorldView.vue';

const scrollAreaRef = ref()

/**
 * 画面を一番上に遷移
 */
function scrollTop() {
  scrollAreaRef.value.setScrollPosition('vertical', 0)
}
setScrollTop(scrollTop)
</script>

<template>
  <q-scroll-area
    ref="scrollAreaRef"
    class="full-height"
    style="flex: 1 1 0;"
  >
    <div class="mainField">
      <q-item class="q-pa-none q-pt-lg">
        <q-item-section>
          <h1 class="q-pt-none">{{ $t("home.worldName.title") }}</h1>
          <WorldNameView />

          <h1 class="q-pt-md">{{ $t("home.version.title") }}</h1>
          <VersionSelecterView />
        </q-item-section>

        <q-item-section side top>
          <WorldIconView />
        </q-item-section>
      </q-item>

      <ExpansionView :title="$t('home.otherSettings')" class="q-pt-xl">
        <h1 class="q-pt-none">{{ $t('home.saveWorld.title') }}</h1>
        <WorldFolderView />
        
        <h1>{{ $t('home.setting.title') }}</h1>
        <BootSettingsView />
      </ExpansionView>
      
      <h1>{{ $t('home.worldOperation') }}</h1>
      <BackupWorldView />

      <WorldDeleteView />
    </div>
  </q-scroll-area>
</template>