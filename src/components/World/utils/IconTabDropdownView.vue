<script setup lang="ts">
import { computed } from 'vue'
import DropBtnView from './dropBtnView.vue'

type DropBtn = {
  name: string
  label: string
}

interface Prop {
  modelValue: string
  name: string
  label: string
  icon: string
  btns: DropBtn[]
}
const prop = defineProps<Prop>()
const emit = defineEmits(['update:model-value'])

const model = computed({
  get() {
    return prop.modelValue;
  },
  set(newValue) {
    emit('update:model-value', newValue);
  },
})
</script>

<template>
  <div class="relative-position self-stretch flex">
    <q-btn-dropdown
      auto-close
      stretch
      flat
      :icon="icon"
      :label="$q.screen.gt.md || model === name ? label : undefined"
      style="
        background: #3B3B3B;
        padding-top: 8px;
        padding-bottom: 8px;
        margin-top: -4px;
        margin-bottom: -4px;"
    >
      <q-list>
        <template v-for="btn in btns" :key="btn">
          <DropBtnView :name="btn.name" :label="btn.label" @click="model = name"/>
        </template>
      </q-list>
    </q-btn-dropdown>

    <!-- indicator -->
    <div v-show="model === name" class="absolute-bottom bg-primary" style="height: 2px;"/>

    <q-tooltip v-if="!($q.screen.gt.md || model === name)">
      {{ label }}
    </q-tooltip>
  </div>
</template>