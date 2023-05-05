<script setup lang="ts">
import { QTableCol } from 'src/components/util/iComponent';
import { useWorldEditStore, PlayerRow } from 'src/stores/WorldEditStore';
import SsSelect from 'src/components/util/base/ssSelect.vue';
import { useDialogStore } from 'src/stores/DialogStore';

const store = useWorldEditStore()

const opLevels = [
  {label: '未設定', value: 'unset'},
  {label: '1', value: '1'},
  {label: '2', value: '2'},
  {label: '3', value: '3'},
  {label: '4', value: '4'},
]

const cols: QTableCol[] = [
  {
    name: 'name',
    required: true,
    field: 'name',
    label: 'プレイヤー',
    sortable: true
  },
  {
    name: 'op',
    label: 'OP',
    field: 'op',
    sortable: false
  },
  {
    name: 'white_list',
    label: 'ホワイトリスト',
    field: 'white_list',
    style: 'text-align: center; width: 10pt',
    sortable: false
  },
  {
    name: 'group',
    label: 'グループ優先',
    field: 'group',
    style: 'text-align: center; width: 10pt',
    sortable: false
  },
  {
    name: 'delete',
    label: '',
    field: 'delete',
    style: 'text-align: center; width: 10pt',
    sortable: false
  }
]

/**
 * ゴミ箱ボタンを押したときの削除処理
 */
function removeItem(item: PlayerRow, idx: number) {
  function removeAction() {
    store.playerRows.splice(idx, 1)
  }

  useDialogStore().showDialog(
    `${item.name}をプレイヤー一覧から削除しますか？`, 
    [
      {label: 'キャンセル'},
      {label: 'OK', color: 'primary', action: removeAction},
    ]
  )
}
</script>

<template>
  <q-table
    class="my-sticky-virtscroll-table q-my-md"
    flat
    bordered
    :rows-per-page-options="[0]"
    row-key="index"
    title="Player"
    :rows="store.playerRows"
    :columns="cols"
    separator="vertical"
    hide-bottom
  >
    <template v-slot:body="props">
      <q-tr :props="props">
        <q-td key="name" :props="props">
          {{ props.row.name }}
        </q-td>
        <q-td key="op" :props="props">
          <ss-select v-model="props.row.op" :options="opLevels" :disable="props.row.group"/>
        </q-td>
        <q-td key="white_list" :props="props">
          <q-checkbox v-model="props.row.white_list" size="3rem" :disable="props.row.group"/>
        </q-td>
        <q-td key="group" :props="props">
          <q-checkbox
          v-model="props.row.group"
          checked-icon="lock"
          unchecked-icon="lock_open"
          size="3.5rem"
          />
        </q-td>
        <q-td key="delete" :props="props">
          <q-btn
            flat
            icon="delete"
            size="1rem"
            @click="removeItem(props.row, props.rowIndex)"
            class="q-pa-none"
          />
        </q-td>
      </q-tr>
    </template>
  </q-table>
</template>