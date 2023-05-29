<script setup lang="ts">
import { computed } from 'vue';
import SsInput from 'src/components/util/base/ssInput.vue';
import SsSelect from 'src/components/util/base/ssSelect.vue';

interface Prop {
  modelValue: string | number | boolean
  inputType: 'enum' | 'string' | 'number' | 'boolean' | 'undefined'
  min?: number
  max?: number
  step?: number
  enum?: any[]
}
const prop = defineProps<Prop>()
const emit = defineEmits(['update:model-value'])

const model = computed({
  get() {
    return prop.modelValue;
  },
  set(newValue) {
    emit('update:model-value', newValue);
  },
})

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
  <div v-if="inputType=='string'" class="row">
    <!-- TODO: clearableが正常に作動しない問題の修正 -->
    <SsInput v-model="model" dense autofocus style="width: 100%;" @clear="model = ''"/>
  </div>
  <div v-if="inputType=='number'" class="row" style="width: 100%;">
    <!-- 半角数字、バリデーションを強制 -->
    <ss-input
      v-model="model"
      class="items-center"
      style="width: 100%;"
      dense
      autofocus
      :rules="[
        val => numberValidate(
          val,
          min,
          max,
          step
          ) || validationMessage(
          min,
          max,
          step
        )]"
    />
  </div>
  <q-toggle v-show="inputType=='boolean'" v-model="model" :label="model.toString()"/>
  <!-- TODO: selectの場合にエラーが出る原因の調査 -->
  <!-- <SsSelect v-show="inputType=='enum'" v-model="model" :options="enum"/> -->
</template>