<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
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
 * 数字入力のバリデーションを定義
 */
function numberValidate(
  val: number,
  min?: number,
  max?: number,
  step?: number
) {
  const re = !isNaN(val); // 半角数字チェック
  const minVal = min === void 0 || val >= min;
  const maxVal = max === void 0 || val <= max;
  const stepVal = step === void 0 || val % step == 0;

  return re && minVal && maxVal && stepVal;
}
/**
 * バリデーションエラー時のメッセージ
 */
function validationMessage(min?: number, max?: number, step?: number) {
  let AdditionalMessage = '';
  if (min !== void 0) {
    AdditionalMessage += t('property.inputField.downerLimit', { n: min });
  }
  if (min !== void 0 && max !== void 0) {
    AdditionalMessage += ', ';
  }
  if (max !== void 0) {
    AdditionalMessage += t('property.inputField.upperLimit', { n: max });
  }
  if (step !== void 0) {
    AdditionalMessage += t('property.inputField.multiple', { n: step });
  }

  if (AdditionalMessage != '') AdditionalMessage = ` (${AdditionalMessage})`;
  return t('property.inputField.number') + AdditionalMessage;
}
</script>

<template>
  <q-toggle
    v-if="typeof propertyValue === 'boolean' || selectEditer() === 'boolean'"
    v-model="propertyValue"
    :label="propertyValue?.toString()"
    style="font-size: 1rem; padding-bottom: 12px"
  />

  <!-- 半角数字、バリデーションを強制 -->
  <ss-input
    v-else-if="selectEditer() === 'number'"
    v-model.number="propertyValue"
    dense
    type="number"
    :autofocus="autofocus"
    :rules="[
      val => numberValidate(
        val,
        (defaultProperty as NumberServerPropertyAnnotation)?.min,
        (defaultProperty as NumberServerPropertyAnnotation)?.max,
        (defaultProperty as NumberServerPropertyAnnotation)?.step
      ) || validationMessage(
        (defaultProperty as NumberServerPropertyAnnotation)?.min,
        (defaultProperty as NumberServerPropertyAnnotation)?.max,
        (defaultProperty as NumberServerPropertyAnnotation)?.step
      )]"
    style="width: 100%"
  />

  <SsSelect
    v-else-if="selectEditer() === 'enum'"
    dense
    v-model="propertyValue"
    :options="(defaultProperty as StringServerPropertyAnnotation)?.enum"
    style="padding-bottom: 18px"
  />

  <SsInput
    v-else
    v-model="propertyValue"
    dense
    :autofocus="autofocus"
    style="width: 100%; padding-bottom: 18px"
  />
</template>
