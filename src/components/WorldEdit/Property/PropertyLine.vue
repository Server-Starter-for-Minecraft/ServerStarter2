<script setup lang="ts">
import { ServerProperty } from 'app/src-electron/schema/serverproperty';
import SsSelect from 'src/components/util/base/ssSelect.vue';
import SsInput from 'src/components/util/base/ssInput.vue';

defineProps(['props'])

/**
 * Propertyの編集に使用するEditerを指定
 */
function selectEditer(prop: ServerProperty) {
  if ('enum' in prop) return 'enum'
  return prop.type
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
  <q-tr :props="props">
    <q-td key="name" :props="props">
      {{ props.row.name }}
    </q-td>
    <q-td key="value" :props="props">
      <div v-show="selectEditer(props.row.value)=='string'" class="row">
        <ss-input v-model="props.row.value.value" dense autofocus style="width: 100%;" />
      </div>
      <div v-show="selectEditer(props.row.value)=='number'" class="row" style="width: 100%;">
        <!-- 半角数字、バリデーションを強制 -->
        <ss-input
          v-model="props.row.value.value"
          class="items-center"
          style="width: 100%;"
          dense
          autofocus
          :rules="[
            val => numberValidate(
              val,
              props.row.value?.min,
              props.row.value?.max,
              props.row.value?.step
              ) || validationMessage(
              props.row.value?.min,
              props.row.value?.max,
              props.row.value?.step
            )]"
        />
      </div>
      <q-toggle v-show="selectEditer(props.row.value)=='boolean'" v-model="props.row.value.value" :label="props.row.value.value.toString()"/>
      <ss-select v-show="selectEditer(props.row.value)=='enum'" v-model="props.row.value.value" :options="props.row.value.enum" :label="props.row.name"/>
    </q-td>
  </q-tr>
</template>