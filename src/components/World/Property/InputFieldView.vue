<script setup lang="ts">
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  isValidNumberProperty,
  NumberServerPropertyAnnotation,
  ServerProperties,
  StringServerPropertyAnnotation,
} from 'app/src-electron/schema/serverproperty';
import { useSystemStore } from 'src/stores/SystemStore';
import SsInput from 'src/components/util/base/ssInput.vue';
import SsSelect from 'src/components/util/base/ssSelect.vue';
import {
  convertPropertyValue,
  getPropertyAnnotation,
} from 'src/logic/property/propertyDefinitions';

const { t } = useI18n();

interface Prop {
  propertyName: string;
  autofocus?: boolean;
  /** 入力を無効化する（編集不可なプロパティに指定する） */
  disable?: boolean;
  /** ワールドの Minecraft のバージョン（ワールドに依らない設定では指定しない） */
  versionId?: string;
}
const prop = defineProps<Prop>();
const model = defineModel<ServerProperties>({ required: true });
const propertyValue = computed({
  get: () => model.value[prop.propertyName],
  set: (newVal) => (model.value[prop.propertyName] = newVal),
});

/**
 * トグル以外の入力欄で編集する値
 *
 * 入力欄は定義の型に合わせて選ぶため，真偽値の値はトグル以外では文字列として扱う
 */
const textValue = computed({
  get: () => {
    const value = propertyValue.value;
    return typeof value === 'boolean' ? String(value) : value;
  },
  set: (newVal) => (propertyValue.value = newVal),
});

const sysStore = useSystemStore();
/**
 * ワールドのバージョンに合うプロパティの注釈（型・既定値・選択肢など）
 *
 * 外部リソースが配布元の最新の内容に更新されると，入力欄も切り替わる
 */
const defaultProperty = computed(() =>
  getPropertyAnnotation(
    sysStore.outerResources.serverProperties,
    prop.propertyName,
    prop.versionId,
    sysStore.vanillaVersionOrder
  )
);

// 値が無い場合は既定値を入れ，値の型が定義と異なる場合は定義の型に合わせる
// （バージョンによって型が異なるプロパティや，外部リソースの更新で定義の型が変わった場合に，入力欄で編集できるようにする）
watch(
  () => defaultProperty.value.type,
  (type) => {
    const value = propertyValue.value;
    if (value === void 0) {
      propertyValue.value = defaultProperty.value.default;
      return;
    }
    const converted = convertPropertyValue(value, type);
    if (converted !== value) propertyValue.value = converted;
  },
  { immediate: true }
);

/**
 * Propertyの編集に使用するEditerを指定
 */
function selectEditer() {
  if ('enum' in defaultProperty.value && defaultProperty.value.enum) {
    return 'enum';
  }
  return defaultProperty.value.type;
}

/**
 * バリデーションエラー時のメッセージ
 */
function validationMessage(min?: number, max?: number, step?: number) {
  const AdditionalMessages = [];
  if (min !== void 0) {
    AdditionalMessages.push(t('property.inputField.downerLimit', { n: min }));
  }
  if (max !== void 0) {
    AdditionalMessages.push(t('property.inputField.upperLimit', { n: max }));
  }
  if (step !== void 0 && step !== 1) {
    AdditionalMessages.push(t('property.inputField.multiple', { n: step }));
  }

  if (AdditionalMessages.length > 0) {
    return `${t('property.inputField.number')} (${AdditionalMessages.join(
      ', '
    )})`;
  } else {
    return t('property.inputField.number');
  }
}
</script>

<template>
  <q-toggle
    v-if="selectEditer() === 'boolean'"
    v-model="propertyValue"
    :label="propertyValue?.toString()"
    :disable="disable"
    style="font-size: 1rem; padding-bottom: 12px"
  />

  <!-- 半角数字、バリデーションを強制 -->
  <ss-input
    v-else-if="selectEditer() === 'number'"
    v-model.number="textValue"
    dense
    type="number"
    :autofocus="autofocus"
    :disable="disable"
    :rules="[
      (val: number) =>
        isValidNumberProperty(
          val,
          defaultProperty as NumberServerPropertyAnnotation
        ) ||
        validationMessage(
          (defaultProperty as NumberServerPropertyAnnotation)?.min,
          (defaultProperty as NumberServerPropertyAnnotation)?.max,
          (defaultProperty as NumberServerPropertyAnnotation)?.step
        ),
    ]"
    style="width: 100%"
  />

  <SsSelect
    v-else-if="selectEditer() === 'enum'"
    dense
    enable-other
    v-model="textValue"
    :options="(defaultProperty as StringServerPropertyAnnotation)?.enum"
    :disable="disable"
    style="padding-bottom: 18px"
  />

  <SsInput
    v-else
    v-model="textValue"
    dense
    :autofocus="autofocus"
    :disable="disable"
    style="width: 100%; padding-bottom: 18px"
  />
</template>
