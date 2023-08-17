<script setup lang="ts">
import { GroupProgress, Progress } from 'app/src-electron/schema/progress';

interface Prop {
  progress?: GroupProgress
}
defineProps<Prop>()

function flatProgress(ps?: Progress[]) {
  function appendProgress(progress?: Progress[]) {
    progress?.forEach(pObj => {
      if (pObj.type !== 'group') {
        returnObj.push(pObj)
      }
      else {
        appendProgress(pObj.value)
      }
    })
  }
  
  const returnObj = [] as Progress[]
  appendProgress(ps)

  return returnObj
}
</script>

<template>
  <template v-for="p in flatProgress(progress?.value)" :key="p">
    <p v-if="p.type === 'title'" class="q-pt-lg q-ma-none" style="font-size: 1rem;">{{ $t(`progress.${p.value.key}`, (p.value as { 'args': Record<string, any> }).args ?? {}) }}</p>
    <p v-else-if="p.type === 'subtitle'" class="text-caption q-ma-none" style="opacity: .6;">{{ $t(`progress.${p.value.key}`, (p.value as { 'args': Record<string, any> }).args ?? {}) }}</p>

    <div v-else-if="p.type === 'numeric'" class="q-pt-lg">
      <q-linear-progress rounded size="15px" :value="p.value/(p.max ?? 100)" color="primary" />
      <p class="text-caption text-right">
        {{ `${p.value}${p.max ? '/' : ''}${p.max} ${p.unit}` }}
      </p>
    </div>
  </template>
    
  <!-- q-linearの再描画が入ると、プログレスバーがリセットされてしまうため、再描画されないように上記と分離 -->
  <div v-show="flatProgress(progress?.value).filter(p => p.type === 'console').length > 0" class="q-pt-lg">
    <q-linear-progress indeterminate rounded size="15px" color="primary" />
    <p class="text-caption text-omit" style="opacity: .6;">
      {{ flatProgress(progress?.value).filter(p => p.type === 'console')[0]?.value }}
    </p>
  </div>
</template>