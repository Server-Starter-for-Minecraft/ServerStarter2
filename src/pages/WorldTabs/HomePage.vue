<script setup lang="ts">
import { ref } from 'vue';
import { setScrollTop } from 'src/components/World/HOME/scroll';
import WorldIconView from 'src/components/World/HOME/Top/WorldIconView.vue';
import BootSettingsView from 'src/components/World/HOME/OtherSettings/BootSettingsView.vue';
import WorldDeleteView from 'src/components/World/HOME/WorldOperation/WorldDeleteView.vue';
import WorldNameView from 'src/components/World/HOME/Top/WorldNameView.vue';
import VersionSelecterView from 'src/components/World/HOME/Top/VersionSelecterView.vue';

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
  <!-- TODO: 起動ボタンを追加　＆　縮小表示の時にワールド名などの入力欄が狭隘になる問題の修正 -->

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
        
      <h1>{{ $t('home.setting.title') }}</h1>
      <BootSettingsView />

      <WorldDeleteView/>
    </div>
  </q-scroll-area>
</template>