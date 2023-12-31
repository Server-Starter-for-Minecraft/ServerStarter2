<script setup lang="ts">
import SsTooltip from 'src/components/util/base/ssTooltip.vue';
interface Prop {
  src: string
  active?: boolean
  label: string
  onClick: () => void
}
defineProps<Prop>()
</script>

<template>
  <q-btn
    dense
    outline
    :color="active ? 'primary' : 'transparent'"
    @click="onClick"
  >
    <q-avatar square size="3rem" class="q-ma-xs">
      <q-icon size="3rem" :name="src" />
    </q-avatar>

    <SsTooltip :name="label" anchor="bottom middle" self="top middle"/>
  </q-btn>
</template>