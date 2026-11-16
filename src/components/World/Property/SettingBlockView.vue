<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { ServerProperties } from 'app/src-electron/schema/serverproperty';
import { useSystemStore } from 'src/stores/SystemStore';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';
import InputFieldView from './InputFieldView.vue';
import { LockReason } from './lockedProperties';
import {
  getPropertyAnnotation,
  getPropertyDescription,
} from './propertyDefinitions';

interface Prop {
  settingName: string;
  /** 編集不可である理由（指定した場合は編集不可として表示する） */
  lockedReason?: LockReason;
  /** ワールドの Minecraft のバージョン（ワールドに依らない設定では指定しない） */
  versionId?: string;
}
const prop = defineProps<Prop>();
const isLocked = computed(() => prop.lockedReason !== undefined);
const propertiesModel = defineModel<ServerProperties>({ required: true });

const { t, te, locale } = useI18n();
const sysStore = useSystemStore();

/** 規定値（ユーザーが設定した標準プロパティ，なければバージョンに合う定義の既定値） */
const defaultProperty = computed(
  () =>
    sysStore.systemSettings.world.properties[prop.settingName] ??
    getPropertyAnnotation(
      sysStore.outerResources.serverProperties,
      prop.settingName,
      prop.versionId,
      sysStore.vanillaVersionOrder
    ).default
);

/** プロパティの説明文（外部リソースの説明文を優先し，なければアプリ内の説明文） */
const description = computed(
  () =>
    getPropertyDescription(
      sysStore.outerResources.serverProperties,
      prop.settingName,
      locale.value,
      (key) => {
        const i18nKey = `property.description['${key}']`;
        return te(i18nKey) ? t(i18nKey) : undefined;
      }
    ) ?? t('property.description.notFound')
);

/**
 * 設定を規定値に戻す
 */
function cancelSettings() {
  propertiesModel.value[prop.settingName] = defaultProperty.value;
}
</script>

<template>
  <q-item flat class="bg-transparent">
    <q-item-section>
      <div class="text-h6">{{ settingName }}</div>
      <div class="text-caption" style="opacity: 0.5">
        {{ description }}
      </div>
      <div v-if="isLocked" class="text-caption text-negative">
        <q-icon name="lock" />
        {{ $t(`property.locked.${lockedReason}`) }}
      </div>
      <InputFieldView
        v-model="propertiesModel"
        :property-name="settingName"
        :disable="isLocked"
        :version-id="versionId"
      />
    </q-item-section>

    <q-item-section
      v-show="
        $router.currentRoute.value.path !== '/system/property' && !isLocked
      "
      side
    >
      <q-btn
        v-show="
          propertiesModel[settingName]?.toString() !==
          defaultProperty.toString()
        "
        flat
        dense
        icon="do_not_disturb_on"
        size="1rem"
        color="negative"
        @click="cancelSettings"
      >
        <SsTooltip
          :name="
            $t('property.resetProperty', {
              defaultProperty:
                defaultProperty !== '' ? defaultProperty : $t('property.empty'),
            })
          "
          anchor="center middle"
          self="top middle"
        />
      </q-btn>
    </q-item-section>
  </q-item>
</template>

<style scoped lang="scss">
h1 {
  font-size: 1.2rem;
}
</style>
