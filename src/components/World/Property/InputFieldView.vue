<script setup lang="ts">
import { useSystemStore } from 'src/stores/SystemStore';
import { NumberServerPropertyAnnotation, StringServerPropertyAnnotation } from 'app/src-electron/schema/serverproperty';
import SsInput from 'src/components/util/base/ssInput.vue';
import SsSelect from 'src/components/util/base/ssSelect.vue';

interface Prop {
  propertyName: string
  autofocus?: boolean
}
const prop = defineProps<Prop>()
const model = defineModel<string | number | boolean>({ required: true })

const sysStore = useSystemStore()
const defaultProperty = sysStore.staticResouces.properties[prop.propertyName]

if (model.value === void 0) {
  model.value = defaultProperty.default
}

/**
 * Propertyの編集に使用するEditerを指定
 */
function selectEditer() {
  if (defaultProperty === void 0) return 'undefined'
  if ('enum' in defaultProperty) return 'enum'
  return defaultProperty.type
}

/**
 * 数字入力のバリデーションを定義
 */
function numberValidate(val:number, min?:number, max?:number, step?:number) {
  const re = !isNaN(val)  // 半角数字チェック
  const minVal = min === void 0 || val >= min
  const maxVal = max === void 0 || val <= max
  const stepVal = step === void 0 || val % step == 0

  return re && minVal && maxVal && stepVal
}
/**
 * バリデーションエラー時のメッセージ
 */
function validationMessage(min?:number, max?:number, step?:number) {
  let AdditionalMessage = ''
  if (min !== void 0) {
    AdditionalMessage+=`${min}以上`
  }
  if (max !== void 0) {
    AdditionalMessage+=`${max}以下`
  }
  if (step !== void 0) {
    AdditionalMessage+=`${step}の倍数`
  }

  if (AdditionalMessage!='') AdditionalMessage = ` (${AdditionalMessage})`
  return `半角数字を入力してください${AdditionalMessage}`
}
</script>

<template>
  <div v-if="typeof model === 'string' && selectEditer()==='string'" class="row">
    <SsInput
      v-model="model"
      dense
      :autofocus="autofocus"
      @clear="model = ''"
      style="width: 100%;"
    />
  </div>
  
  <div v-else-if="(typeof model === 'string' || typeof model === 'number') && selectEditer()==='number'" class="row" style="width: 100%;">
    <!-- 半角数字、バリデーションを強制 -->
    <ss-input
      v-model="model"
      class="items-center"
      style="width: 100%;"
      dense
      :autofocus="autofocus"
      @clear="model = ''"
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
    />
  </div>
  
  <q-toggle
    v-else-if="selectEditer()==='boolean'"
    v-model="model"
    :label="model?.toString()"
    style="font-size: 1rem;"
  />
  
  <SsSelect
    v-else-if="selectEditer()==='enum'"
    dense
    v-model="model"
    :options="(defaultProperty as StringServerPropertyAnnotation)?.enum"
  />
</template>