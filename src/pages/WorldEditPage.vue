<script setup lang="ts">
import { Drawer, useMainStore } from 'src/stores/MainStore';
import { useWorldEditStore } from 'src/stores/WorldEditStore';

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
</script>

<template>
  <q-page class="mainField column center q-pa-md">
    <router-view />

    <div class="q-py-md text-right">
      <q-btn color="grey" label="キャンセル" size="1rem" to="/" replace class="q-ma-sm btn"/>
      <q-btn color="primary" label="保存" size="1rem" to="/" replace @click="store.saveFunc" class="q-ma-sm btn"/>
    </div>
  </q-page>
</template>

<style scoped lang="scss">
.center {
  margin: 0 auto;
  width: 100%;
}

.btn {
  width: 7rem;
}
</style>
