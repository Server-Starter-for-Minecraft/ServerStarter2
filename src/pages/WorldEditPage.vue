<script setup lang="ts">
import { Drawer, useMainStore } from 'src/stores/MainStore';
import { useWorldEditStore } from 'src/stores/WorldEditStore';
import { onBeforeMount } from 'vue';

const store = useWorldEditStore()

const drawer: Drawer[] = [
  {
    icon: 'settings',
    label: 'General',
    separator: true,
    to: '/world-edit/'
  },
  {
    icon: 'list_alt',
    label: 'Property',
    separator: false,
    to: '/world-edit/property'
  },
  {
    icon: 'group',
    label: 'Person List',
    separator: false,
    to: '/world-edit/person'
  },
  {
    icon: 'library_add',
    label: 'Additional List',
    separator: false,
    to: '/world-edit/additional'
  },
  {
    icon: 'share',
    label: 'ShareWorld',
    separator: false,
    to: '/world-edit/share-world'
  },
]

useMainStore().setHeader(store.title, { drawerContents: drawer })

onBeforeMount(store.updateRows)
</script>

<template>
  <q-page class="mainField center">
    <router-view />

    <q-btn color="primary" label="保存" to="/" replace @click="store.saveFunc" />
    <q-btn label="キャンセル" to="/" replace/>
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
