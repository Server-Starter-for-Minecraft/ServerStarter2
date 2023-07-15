<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { colorThemes, ColorTheme, locales, Locale } from 'app/src-electron/schema/system';
import { useSystemStore } from 'src/stores/SystemStore';
import { assets } from 'src/assets/assets';
import SsSelect from 'src/components/util/base/ssSelect.vue';
import ColorThemeBtn from 'src/components/SystemSettings/General/ColorThemeBtn.vue';

const sysStore = useSystemStore()
const t = useI18n()
const q = useQuasar();

function changeLocale(loc: Locale) {
  t.locale.value = loc
}

function changeTheme(colorTheme: ColorTheme) {
  // システム設定に登録
  sysStore.systemSettings().user.theme = colorTheme
  
  // 設定を画面に反映
  switch (colorTheme) {
    case 'auto':
      q.dark.set('auto');
      break;
    case 'dark':
      q.dark.set(true);
      break;
    case 'light':
      q.dark.set(false);
      break;
  }
}
</script>

<template>
  <div class="mainField">
    <h1 class="q-mt-none">言語</h1>
    <SsSelect
      dense
      v-model="sysStore.systemSettings().user.language"
      @update:model-value="newVal => changeLocale(newVal)"
      :options="locales"
    />

    <h1>配色テーマ</h1>
    <div class="row q-gutter-lg">
      <template v-for="theme in colorThemes" :key="theme">
        <ColorThemeBtn
          :src="assets.svg[theme]"
          :active="sysStore.systemSettings().user.theme === theme"
          :label="theme"
          @click="() => changeTheme(theme)"
        />
      </template>
    </div>
    <!-- <SsSelect
      v-model="sysStore.systemSettings().user.theme"
      @update:model-value="newVal => changeTheme(newVal)"
      :options="colorThemes"
      label="ServerStarterの配色モードを選択してください"
    /> -->

    <h1>自動シャットダウン</h1>
    <q-checkbox
      v-model="sysStore.systemSettings().user.autoShutDown"
      label="サーバー終了後に自動でPCをシャットダウンする"
      style="font-size: 1rem;"
    />
  </div>
</template>