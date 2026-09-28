<script setup lang="ts">
import { computed } from 'vue';
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

const { t } = useI18n();

interface Prop {
  propertyName: string;
  autofocus?: boolean;
  /** 入力を無効化する（編集不可なプロパティに指定する） */
  disable?: boolean;
}
const prop = defineProps<Prop>();
const model = defineModel<ServerProperties>({ required: true });
const propertyValue = computed({
  get: () => model.value[prop.propertyName],
  set: (newVal) => (model.value[prop.propertyName] = newVal),
});

const sysStore = useSystemStore();
const defaultProperty = sysStore.staticResouces.properties[
  prop.propertyName
] ?? { type: 'string', default: '' };

if (propertyValue.value === void 0) {
  propertyValue.value = defaultProperty.default;
}

/**
 * Propertyの編集に使用するEditerを指定
 */
function selectEditer() {
  if (defaultProperty === void 0) return 'undefined';
  if ('enum' in defaultProperty) return 'enum';
  return defaultProperty.type;
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
    v-if="typeof propertyValue === 'boolean' || selectEditer() === 'boolean'"
    v-model="propertyValue"
    :label="propertyValue?.toString()"
    :disable="disable"
    style="font-size: 1rem; padding-bottom: 12px"
  />

  <!-- 半角数字、バリデーションを強制 -->
  <ss-input
    v-else-if="selectEditer() === 'number'"
    v-model.number="propertyValue"
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
    v-model="propertyValue"
    :options="(defaultProperty as StringServerPropertyAnnotation)?.enum"
    :disable="disable"
    style="padding-bottom: 18px"
  />

  <SsInput
    v-else
    v-model="propertyValue"
    dense
    :autofocus="autofocus"
    :disable="disable"
    style="width: 100%; padding-bottom: 18px"
  />
</template>
