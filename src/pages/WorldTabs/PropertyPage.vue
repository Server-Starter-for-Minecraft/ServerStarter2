<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import type { QScrollArea } from 'quasar';
import {
  getPropertyAnnotation,
  isUnavailableInVersion,
  resetProperties,
} from 'src/logic/property/propertyDefinitions';
import { isValid } from 'app/src-public/scripts/error';
import { fromEntries, keys } from 'app/src-public/scripts/obj/obj';
import { ServerProperties } from 'app/src-electron/schema/serverproperty';
import { $T } from 'src/i18n/utils/tFunc';
import { useMainStore } from 'src/stores/MainStore';
import { useSystemStore } from 'src/stores/SystemStore';
import { usePropertyStore } from 'src/stores/WorldTabs/PropertyStore';
import { dangerDialogProp } from 'src/components/util/danger/iDangerDialog';
import { getLockedProperties } from 'src/components/World/Property/lockedProperties';
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
 * ワールドのバージョンで存在しない（未導入・終了した）プロパティか
 *
 * このようなプロパティは画面に表示せず，リセットでも値を変更しない（server.properties の値は残す）
 */
function isUnavailable(key: string) {
  return isUnavailableInVersion(
    sysStore.outerResources.serverProperties,
    key,
    versionId.value,
    sysStore.vanillaVersionOrder
  );
}

/**
 * システムが規定するデフォルトプロパティ
 *
 * ワールドのバージョンに合う定義の既定値とし，ワールドのバージョンで存在しないプロパティは含めない
 */
const initProperty = computed<ServerProperties>(() => {
  const resource = sysStore.outerResources.serverProperties;
  const order = sysStore.vanillaVersionOrder;
  // 外部リソースの読み込み前は，既定値を持つプロパティが無い
  const activeKeys = keys(resource?.properties ?? {}).filter(
    (key) => !isUnavailable(key)
  );
  return fromEntries(
    activeKeys.map((key) => [
      key,
      getPropertyAnnotation(resource, key, versionId.value, order).default,
    ])
  );
});

// 入力領域のスクロールバーの制御
const scrollAreaRef = ref<QScrollArea | null>(null);

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
 * 全てのServer Propertyを基本設定に戻す
 *
 * 編集できないプロパティと，ワールドのバージョンで存在しない（画面に表示しない）プロパティは変更しない
 */
function resetAll() {
  $q.dialog({
    component: DangerDialog,
    componentProps: {
      dialogTitle: $T('property.resetAll.title'),
      dialogDesc: $T('property.resetAll.desc'),
      okBtnTxt: $T('property.resetAll.okBtn'),
    } satisfies dangerDialogProp,
  }).onOk(() => {
    // プロパティを読み込めていないワールドは，画面にリセットのボタンを表示しない
    if (mainStore.world && isValid(mainStore.world.properties)) {
      mainStore.world.properties = resetProperties(
        mainStore.world.properties,
        sysStore.systemSettings.world.properties,
        initProperty.value,
        (key) => lockedProperties.value[key] !== undefined || isUnavailable(key)
      );
    }
  });
}

/**
 * 画面を一番上に遷移
 */
function scrollTop() {
  scrollAreaRef.value?.setScrollPosition('vertical', 0);
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
