<script setup lang="ts">
import { useMainStore } from 'src/stores/MainStore';

const store = useMainStore();
</script>

<template>  
  <q-drawer
      v-model="store.leftDrawerOpen"
      :mini="$q.screen.lt.md"
      :width="300"
      :breakpoint="100"
      bordered
      :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-grey-3'"
    >
      <q-list>
        <template v-for="(menuItem, index) in store.drawerContents" :key="index">
          <q-item
            clickable
            v-ripple
            :active="store.selectedDrawer === menuItem.label"
            @click="store.selectedDrawer = menuItem.label"
            :to="menuItem.to"
            class="q-pa-md"
          >
            <q-item-section avatar>
              <q-icon :name="menuItem.icon" size="1.4rem"/>
            </q-item-section>
            <q-item-section>
              <span style="font-size: 1.2rem;">{{ menuItem.label }}</span>
            </q-item-section>
            <q-tooltip
              v-if="$q.screen.lt.md"
              anchor="center right"
              self="center left"
              :offset="[10, 10]"
              class="text-body1"
            >
              {{ menuItem.label }}
            </q-tooltip>
          </q-item>
          <q-separator :key="'sep' + index"  v-if="menuItem.separator" />
        </template>
      </q-list>
    </q-drawer>

</template>