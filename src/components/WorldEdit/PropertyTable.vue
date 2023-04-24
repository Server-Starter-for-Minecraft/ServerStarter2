<script setup lang="ts">
import { ref } from 'vue'
import { defaultServerProperties } from 'app/src-electron/core/server/settings/properties';
import { useWorldEditStore } from 'src/stores/WorldEditStore';

const store = useWorldEditStore()
/**
 * TODO: Propertyがない場合はデフォルトを適用し、ある場合はある項目だけ参照して他の項目はDefaultを適用させる
 */
function setfirstProperty() {
  
  const _defaultServerProperties = defaultServerProperties
  if (store.world.settings?.properties === void 0) { return _defaultServerProperties }
  
  for (const key in store.world.settings.properties) {
    _defaultServerProperties[key] = store.world.settings.properties[key]
  }
  // return 
  return defaultServerProperties
}
const serverProperty = ref(setfirstProperty())

const cols = [
  {
    name: 'name',
    required: true,
    label: 'プロパティ名',
    field: 'name',
    sortable: true
  },
  {
    name: 'value',
    label: '値',
    field: 'value',
    style: {width: '200px'},
  },
]
const rows = Object.entries(serverProperty.value).map(([k, v]) => { return { name: k, value: v.value } })
</script>

<template>
  <q-table
    class="my-sticky-virtscroll-table"
    virtual-scroll
    flat bordered
    :rows-per-page-options="[0]"
    row-key="index"
    :rows="rows"
    :columns="cols"
    hide-bottom
  >
    <template v-slot:body="props">
      <q-tr :props="props">
        <q-td key="name" :props="props">
          {{ props.row.name }}
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
</template>


<style lang="scss">
.my-sticky-virtscroll-table {
  /* height or max-height is important */
  height: 410px;

  .q-table__top, .q-table__bottom, thead, th {
    /* bg color is important for th; just specify one */
    background-color: #00b4ff;
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