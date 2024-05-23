<script setup lang="ts">
import { Ref, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { Player } from 'app/src-electron/schema/player';
import {
  ColorTheme,
  colorThemes,
  Locale,
} from 'app/src-electron/schema/system';
import { assets } from 'src/assets/assets';
import { tError } from 'src/i18n/utils/tFunc';
import { useSystemStore } from 'src/stores/SystemStore';
import { setColor } from 'src/color';
import { checkError } from 'src/components/Error/Error';
import {
  OwnerDialogProp,
  ReturnOwnerDialog,
} from 'src/components/SystemSettings/General/OwnerSetter/iOwnerDialog';
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

const ownerPlayer: Ref<Player | undefined> = ref();
const setOwnerPlayer = async (uuid?: PlayerUUID) => {
  if (uuid) {
    const res = await window.API.invokeGetPlayer(uuid, 'uuid');
    checkError(
      res,
      (p) => (ownerPlayer.value = p),
      (e) => tError(e)
    );
  }
};
setOwnerPlayer(sysStore.systemSettings.user.owner);

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
    componentProps: {
      ownerPlayer: ownerPlayer.value,
    } as OwnerDialogProp,
  }).onOk((p: ReturnOwnerDialog) => {
    ownerPlayer.value = p.ownerPlayer;
    sysStore.systemSettings.user.owner = p.ownerPlayer?.uuid;
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
      <PlayerCard v-model="ownerPlayer" />
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
