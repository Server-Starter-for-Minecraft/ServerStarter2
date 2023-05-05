<script setup lang="ts">
import { ServerProperty } from 'app/src-electron/schema/serverproperty';
import { useWorldEditStore } from 'src/stores/WorldEditStore';
import { QTableCol } from 'src/components/util/iComponent';
import SsSelect from '../util/base/ssSelect.vue';
import SsInput from '../util/base/ssInput.vue';
import TitleVue from './TitleVue.vue';
import PropertyLine from './Property/PropertyLine.vue'

const store = useWorldEditStore()

const cols: QTableCol[] = [
  {
    name: 'name',
    required: true,
    field: 'name',
    label: 'プロパティ名',
    style: 'width: 300px',
    sortable: true
  },
  {
    name: 'value',
    label: '値',
    field: 'value',
    style: 'text-align: left',
    sortable: false
  },
]

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
  <TitleVue title="Property"/>

  <!-- TODO: headerを残しつつ、画面いっぱいに表を表示する方法があれば改善 -->
  <q-scroll-area class="fit" style="flex: 1 1 0">
    <!-- TODO: 規定値を用いるか否かの対応（データ構造に規定値云々の記述はあるのか？） -->
    <q-table
      class="my-sticky-virtscroll-table"
      flat
      bordered
      :rows-per-page-options="[0]"
      row-key="index"
      :rows="store.propertyRows"
      :columns="cols"
      :loading="store.propertyRows.length === 0"
      hide-bottom
    >
      <template v-slot:body="props">
        <!-- TODO: PropertyLineを分散定義するとエラーになる理由の検証 -->
        <!-- <PropertyLine :props="props"/> -->
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
  
      <template v-slot:loading>
        <q-inner-loading showing color="primary"/>
      </template>
    </q-table>
  </q-scroll-area>
</template>

<style lang="scss">
td {
  font-size: 1rem !important;
}
</style>
