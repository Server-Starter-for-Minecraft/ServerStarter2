<script setup lang="ts">
import DropBtnView from './dropBtnView.vue'

type DropBtn = {
  path: string
  label: string
}

interface Prop {
  path: string
  label: string
  icon: string
  btns: DropBtn[]
}
const prop = defineProps<Prop>()

const dropLabels = prop.btns.map(btn => `/${btn.path}`)
</script>

<template>
  <div class="relative-position self-stretch flex">
    <q-btn-dropdown
      auto-close
      stretch
      flat
      :icon="icon"
      :label="$q.screen.gt.md || dropLabels.includes($route.path) ? label : undefined"
      :class="dropLabels.includes($route.path) ? 'text-primary' : ''"
      style="
        padding-top: 8px;
        padding-bottom: 8px;
        margin-top: -4px;
        margin-bottom: -4px;"
    >
      <q-list>
        <template v-for="btn in btns" :key="btn">
          <DropBtnView :name="btn.path" :label="btn.label"/>
        </template>
      </q-list>
    </q-btn-dropdown>

    <!-- indicator -->
    <div v-show="dropLabels.includes($route.path)" class="absolute-bottom bg-primary" style="height: 2px;"/>

    <q-tooltip v-if="!($q.screen.gt.md || dropLabels.includes($route.path))">
      {{ label }}
    </q-tooltip>
  </div>
</template>