<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import {
  ColorTheme,
  colorThemes,
  Locale,
} from 'app/src-electron/schema/system';
import { assets } from 'src/assets/assets';
import { useSystemStore } from 'src/stores/SystemStore';
import { setColor } from 'src/color';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import SsSelect from 'src/components/util/base/ssSelect.vue';
import ColorThemeBtn from 'src/components/SystemSettings/General/ColorThemeBtn.vue';
import OwnerDialog from 'src/components/SystemSettings/General/OwnerSetter/OwnerDialog.vue';
import PlayerCard from 'src/components/SystemSettings/General/PlayerCard.vue';

const sysStore = useSystemStore();
const t = useI18n();
const $q = useQuasar();

const localeOptions: { value: Locale; label: string }[] = [
  { value: 'ja', label: '日本語' },
  { value: 'en-US', label: 'English' },
];

function changeLocale(loc: Locale) {
  t.locale.value = loc;
}

function changeTheme(colorTheme: ColorTheme) {
  // システム設定に登録
  sysStore.systemSettings.user.theme = colorTheme;

  // 設定を画面に反映
  switch (colorTheme) {
    case 'auto':
      $q.dark.set('auto');
      break;
    case 'dark':
      $q.dark.set(true);
      break;
    case 'light':
      $q.dark.set(false);
      break;
  }
}

function showOwnerDialog() {
  $q.dialog({
    component: OwnerDialog,
  });
}
</script>

<template>
  <div class="vertical-scroll">
    <div class="mainField">
      <h1 class="q-mt-none">{{ $t('systemsetting.general.lang') }}</h1>
      <SsSelect
        dense
        v-model="sysStore.systemSettings.user.language"
        @update:model-value="(newVal) => changeLocale(newVal)"
        :options="localeOptions"
        option-label="label"
        option-value="value"
      />

      <h1>{{ $t('systemsetting.general.colorMode') }}</h1>
      <div class="row q-gutter-lg">
        <template v-for="theme in colorThemes" :key="theme">
          <ColorThemeBtn
            :src="assets.svg[theme]()"
            :active="sysStore.systemSettings.user.theme === theme"
            :label="theme"
            @click="() => changeTheme(theme)"
          />
        </template>
      </div>
      <q-toggle
        v-model="sysStore.systemSettings.user.visionSupport"
        @update:model-value="(val) => setColor($q.dark.isActive, val)"
        :label="
          sysStore.systemSettings.user.visionSupport
            ? $t('systemsetting.general.useVisionSupport')
            : $t('systemsetting.general.noVisionSupport')
        "
        class="q-pt-lg"
        style="font-size: 1rem"
      />

      <h1>{{ $t('owner.register') }}</h1>
      <p class="q-my-sm text-body2" style="opacity: 0.5">
        {{ $t('owner.generalDesc') }}
      </p>
      <PlayerCard v-model="sysStore.systemSettings.user.owner" />
      <SsBtn
        :label="`${
          sysStore.systemSettings.user.owner
            ? $t('owner.change')
            : $t('owner.register')
        }`"
        :color="!sysStore.systemSettings.user.owner ? 'primary' : undefined"
        @click="showOwnerDialog"
        class="q-my-md"
      />
    </div>
  </div>
</template>
