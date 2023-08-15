<script setup lang="ts">
import { GroupProgress } from 'app/src-electron/schema/progress';

interface Prop {
  progress: GroupProgress
}
defineProps<Prop>()
</script>

<template>
  <template v-for="p in progress.value" :key="p">
    <div v-if="p.type === 'title'">
      <span style="font-size: 1rem;">{{ $t(p.value.key, (p.value as { 'args': Record<string, any> }).args ?? {}) }}</span>
    </div>

    <div v-else-if="p.type === 'subtitle'">
      <span class="text-caption">{{ $t(p.value.key, (p.value as { 'args': Record<string, any> }).args ?? {}) }}</span>
    </div>

    <div v-else-if="p.type === 'numeric'">
      <q-linear-progress rounded size="15px" :value="p.value" color="primary" />
      <span class="text-caption text-right full-width">
        {{ `${p.value}${p.max ? '/' : ''}${p.max} ${p.unit}` }}
      </span>
    </div>
    
    <div v-else-if="p.type === 'console'">
      <q-linear-progress indeterminate rounded size="15px" color="primary" />
      <span class="text-caption text-omit">
        {{ p.value }}
      </span>
    </div>
  
    <ProgressView
      v-else-if="p.type === 'group'"
      :progress="p"
    />
  </template>
</template>