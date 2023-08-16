<script setup lang="ts">
import { GroupProgress } from 'app/src-electron/schema/progress';

interface Prop {
  progress: GroupProgress
}
defineProps<Prop>()
</script>

<template>
  <template v-for="p in progress.value" :key="p">
    <p v-if="p.type === 'title'" class="q-pt-lg q-ma-none" style="font-size: 1rem;">{{ $t(`progress.${p.value.key}`, (p.value as { 'args': Record<string, any> }).args ?? {}) }}</p>
    <p v-else-if="p.type === 'subtitle'" class="text-caption q-ma-none" style="opacity: .6;">{{ $t(`progress.${p.value.key}`, (p.value as { 'args': Record<string, any> }).args ?? {}) }}</p>

    <div v-else-if="p.type === 'numeric'" class="q-pt-lg">
      <q-linear-progress rounded size="15px" :value="p.value" color="primary" />
      <p class="text-caption text-right">
        {{ `${p.value}${p.max ? '/' : ''}${p.max} ${p.unit}` }}
      </p>
    </div>
    
    <div v-show="p.type === 'console'" class="q-pt-lg">
      <q-linear-progress indeterminate rounded size="15px" color="primary" />
      <p class="text-caption text-omit" style="opacity: .6;">
        {{ p.value }}
      </p>
    </div>
  
    <ProgressView
      v-if="p.type === 'group'"
      :progress="p"
    />
  </template>
</template>