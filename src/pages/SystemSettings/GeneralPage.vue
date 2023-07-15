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
    <h1 class="q-mt-none">{{ $t("systemsetting.general.lang") }}</h1>
    <SsSelect
      v-model="sysStore.systemSettings().user.language"
      @update:model-value="newVal => changeLocale(newVal)"
      :options="locales"
      :label="$t('systemsetting.general.langDesc')"
    />

    <h1>{{ $t("systemsetting.general.colorMode") }}</h1>
    <SsSelect
      v-model="sysStore.systemSettings().user.theme"
      @update:model-value="newVal => changeTheme(newVal)"
      :options="colorThemes"
      :label="$t('systemsetting.general.langDesc')"
    />

    <h1>{{ $t("systemsetting.general.autoShutdown") }}</h1>
    <q-checkbox
      v-model="sysStore.systemSettings().user.autoShutDown"
      :label="$t('systemsetting.general.shutdownDesc')"
      style="font-size: 1rem;"
    />
  </div>
</template>