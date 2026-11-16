<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import { isValid } from 'app/src-public/scripts/error';
import { fromEntries, keys } from 'app/src-public/scripts/obj/obj';
import { ServerProperties } from 'app/src-electron/schema/serverproperty';
import { $T } from 'src/i18n/utils/tFunc';
import { useMainStore } from 'src/stores/MainStore';
import { useSystemStore } from 'src/stores/SystemStore';
import { usePropertyStore } from 'src/stores/WorldTabs/PropertyStore';
import { dangerDialogProp } from 'src/components/util/danger/iDangerDialog';
import { getLockedProperties } from 'src/components/World/Property/lockedProperties';
import {
  getPropertyAnnotation,
  isRemovedProperty,
} from 'src/components/World/Property/propertyDefinitions';
import { thumbStyle } from 'src/components/World/scrollBar';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import SsInput from 'src/components/util/base/ssInput.vue';
import DangerDialog from 'src/components/util/danger/DangerDialog.vue';
import SettingsView from 'src/components/World/Property/SettingsView.vue';
import SideMenuView from 'src/components/World/Property/SideMenuView.vue';

const $q = useQuasar();
const sysStore = useSystemStore();
const mainStore = useMainStore();
const propertyStore = usePropertyStore();

/** ワールドの Minecraft のバージョン（バージョンが不明なワールドでは `undefined`） */
const versionId = computed(() => {
  const version = mainStore.world?.version;
  return version && 'id' in version ? version.id : undefined;
});

/**
 * システムが規定するデフォルトプロパティ
 *
 * ワールドのバージョンに合う定義の既定値とし，ワールドのバージョンで廃止されたプロパティは含めない
 */
const initProperty = computed<ServerProperties>(() => {
  const definitions = sysStore.outerResources.serverProperties;
  const order = sysStore.vanillaVersionOrder;
  const activeKeys = keys(definitions).filter(
    (key) => !isRemovedProperty(definitions[key], versionId.value, order)
  );
  return fromEntries(
    activeKeys.map((key) => [
      key,
      getPropertyAnnotation(definitions, key, versionId.value, order).default,
    ])
  );
});

// 入力領域のスクロールバーの制御
const scrollAreaRef = ref();

// ワールドの設定（ポート開放不要化の利用など）によって編集できないプロパティ
const lockedProperties = computed(() =>
  mainStore.world
    ? getLockedProperties(
        mainStore.world,
        sysStore.systemSettings.user.ngrokToken
      )
    : {}
);

/**
 * 全てのServer Propertyを基本設定に戻す（編集できないプロパティは変更しない）
 */
function resetAll() {
  $q.dialog({
    component: DangerDialog,
    componentProps: {
      dialogTitle: $T('property.resetAll.title'),
      dialogDesc: $T('property.resetAll.desc'),
      okBtnTxt: $T('property.resetAll.okBtn'),
    } as dangerDialogProp,
  }).onOk(() => {
    Object.keys(sysStore.systemSettings.world.properties).map((key) => {
      if (lockedProperties.value[key] !== undefined) return;
      if (mainStore.world && isValid(mainStore.world.properties)) {
        mainStore.world.properties[key] =
          sysStore.systemSettings.world.properties[key];
      }
    });
  });
}

/**
 * 画面を一番上に遷移
 */
function scrollTop() {
  scrollAreaRef.value.setScrollPosition('vertical', 0);
}
</script>

<template>
  <div class="mainField">
    <div
      v-if="mainStore.world && isValid(mainStore.world.properties)"
      class="column fit"
    >
      <div class="row q-py-md">
        <SsInput
          dense
          v-model="propertyStore.searchName"
          :placeholder="$t('property.main.search')"
          class="col"
        />

        <SsBtn
          dense
          isCapital
          :label="$t('property.resetAll.btn')"
          icon="do_not_disturb_on_total_silence"
          color="negative"
          width="6rem"
          @click="resetAll"
          class="q-ml-md"
        />
      </div>

      <div class="row fit" style="flex: 1 1 0">
        <SideMenuView @scroll-top="scrollTop" />

        <q-separator vertical inset />

        <div class="col">
          <q-scroll-area
            ref="scrollAreaRef"
            :thumb-style="thumbStyle"
            class="fit"
          >
            <SettingsView
              v-model="mainStore.world.properties"
              :locked-properties="lockedProperties"
              :version-id="versionId"
            />
          </q-scroll-area>
        </div>
      </div>
    </div>

    <div v-else class="fit" style="position: relative">
      <div class="absolute-center">
        <p>{{ $t('property.failed') }}</p>
        <SsBtn
          v-if="mainStore.world"
          :label="$t('property.reset')"
          color="primary"
          @click="mainStore.world.properties = { ...initProperty }"
          class="full-width"
        />
      </div>
    </div>
  </div>
</template>
