<script setup lang="ts">
import { useWorldEditStore } from 'src/stores/WorldEditStore';
import { QTableCol } from 'src/components/util/iComponent';
import SsSelect from '../util/base/ssSelect.vue';
import SsInput from '../util/base/ssInput.vue';
import { ServerProperty } from 'app/src-electron/schema/serverproperty';

const store = useWorldEditStore()

const cols: QTableCol[] = [
  {
    name: 'name',
    required: true,
    field: 'name',
    label: 'プロパティ名',
    style: 'width: 400px',
    sortable: true
  },
  {
    name: 'value',
    label: '値',
    field: 'value',
    sortable: true
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
  const minVal = min === void 0 || val > min
  const maxVal = max === void 0 || val < max
  const stepVal = step === void 0 || val % step == 0

  return re && minVal && maxVal && stepVal
}
/**
 * バリデーションエラー時のメッセージ
 * TODO: メッセージのデバッグ 
 */
function validationMessage(min?:number, max?:number, step?:number) {
  let AdditionalMessage = ''
  if (min !== void 0) {
    AdditionalMessage+=`${min}以上`
  }
  if (max !== void 0) {
    AdditionalMessage+=`${min}以下`
  }
  if (max !== void 0) {
    AdditionalMessage+=`${step}の倍数`
  }

  if (AdditionalMessage!='') AdditionalMessage = ` (${AdditionalMessage})`
  return `半角数字を入力してください${AdditionalMessage}`
}
</script>

<template>
  <h1>Property</h1>

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
          <q-checkbox v-show="selectEditer(props.row.value)=='boolean'" v-model="props.row.value.value" :label="props.row.value.value"/>
          <!-- TODO: 表の中でプルダウンが表示されない問題の修正 -->
          <ss-select v-show="selectEditer(props.row.value)=='enum'" v-model="props.row.value.value" :options="props.row.value.enum" :label="props.row.name"/>
        </q-td>
      </q-tr>
    </template>

    <template v-slot:loading>
      <q-inner-loading showing color="primary"/>
    </template>
  </q-table>
</template>

<style lang="scss">
.my-sticky-virtscroll-table {
  /* height or max-height is important */
  height: 410px;

  .q-table__top,
  .q-table__bottom,
  thead,
  th {
    /* bg color is important for th; just specify one */
    background-color: $primary;
  }

  thead tr th {
    position: sticky;
    z-index: 1;
  }

  tr th {
    font-size: 1.2rem;
  }

  /* this will be the loading indicator */
  thead tr:last-child th {
    /* height of all previous header rows */
    top: 48px;
  }

  thead tr:first-child th {
    top: 0;
  }

  /* prevent scrolling behind sticky top row on focus */
  tbody {
    /* height of all previous header rows */
    scroll-margin-top: 48px;
  }
}

td {
  font-size: 1rem !important;
}
</style>
