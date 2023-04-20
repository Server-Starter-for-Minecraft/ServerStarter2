<script setup lang="ts">
import { ref } from 'vue';
import { versionTypes } from 'app/src-electron/api/scheme.js';
import { useWorldEditStore } from 'src/stores/WorldEditStore';
import propertyItem from 'src/components/util/propertyItem.vue';

interface Props {
  saveFunc: () => void
}
defineProps<Props>()

const store = useWorldEditStore()
const versionList = ['1.19.2', '1.19.1', '1.19.0'];
const worldTypes = ['default', 'flat', 'largeBiomes', 'amplified']
// TODO: worldTypeの初期値を決定
const worldType = ref()


const cols = [
  {
    name: 'propName',
    label: 'プロパティ名',
    field: 'propName',
  },
  {
    name: 'value',
    label: '値',
    field: 'value'
  },
]
const rows = [
  {
    propName: 'gamemode',
    value: 'survival',
  },
  {
    propName: 'white-list',
    value: 'true',
  },
  {
    propName: 'difficulty',
    value: 'normal',
  },
]
</script>

<template>
  <q-page class="mainField center">
    <propertyItem propName="name">
      <template v-slot:userInput>
        <!-- TODO: ワールド名のバリデーション -->
        <q-input
          v-model="store.world.name"
          clearable
          label="ワールド名"
          style="width: 300px"
        />
      </template>
    </propertyItem>

    <propertyItem propName="version">
      <template v-slot:userInput>
          <q-select
            v-model="store.world.settings.version.type"
            :options="versionTypes"
            label="サーバー"
            style="width: 150px"
            class="q-pr-lg"
          />
          <q-select
            v-model="store.world.settings.version.id"
            :options="versionList"
            label="バージョン"
            style="width: 150px"
            class="q-pr-lg"
          />
      </template>
    </propertyItem>

    <propertyItem propName="world type">
      <template v-slot:userInput>
        <q-select
          v-model="worldType"
          :options="worldTypes"
          label="ワールドタイプ"
          style="width: 150px"
        />
      </template>
    </propertyItem>

    <h1 id="Property">Property</h1>
    <q-table
      flat bordered
      :rows="rows"
      :columns="cols"
      row-key="propName"
      :rows-per-page-options="[5, 10, 0]"
    >
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td key="propName" :props="props">
            {{ props.row.propName }}
          </q-td>
          <q-td key="value" :props="props">
            {{ props.row.value }}
            <q-popup-edit v-model="props.row.value" v-slot="scope">
              <q-input v-model="scope.value" dense autofocus counter @keyup.enter="scope.set" />
            </q-popup-edit>
          </q-td>
        </q-tr>
      </template>
    </q-table>
    
    <h1 id="PersonList">Person List</h1>
    <h1 id="AdditionalList">Additional List</h1>
    <h1 id="ShareWorld">ShareWorld</h1>

    <q-btn color="primary" label="保存" to="/" replace @click="saveFunc"/>

  </q-page>
</template>

<style scoped lang="scss">
h1 {
  font-size: 26pt;
}
.center {
  margin: 0 auto;
  width: max-content;
}
</style>