<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { colorThemes, ColorTheme, locales, Locale } from 'app/src-electron/schema/system';
import { useSystemStore } from 'src/stores/SystemStore';
import SsSelect from 'src/components/util/base/ssSelect.vue';

const sysStore = useSystemStore()
const t = useI18n()
const q = useQuasar();

function changeLocale(loc: Locale) {
  t.locale.value = loc
}

function changeTheme(colorTheme: ColorTheme) {
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
      v-model="sysStore.systemSettings().user.language"
      @update:model-value="newVal => changeLocale(newVal)"
      :options="locales"
      label="言語を選択してください"
    />

    <h1>配色モード</h1>
    <SsSelect
      v-model="sysStore.systemSettings().user.theme"
      @update:model-value="newVal => changeTheme(newVal)"
      :options="colorThemes"
      label="ServerStarterの配色モードを選択してください"
    />

    <h1>自動シャットダウン</h1>
    <q-checkbox
      v-model="sysStore.systemSettings().user.autoShutDown"
      label="サーバー終了後に自動でPCをシャットダウンする"
      style="font-size: 1rem;"
    />
  </div>
</template>