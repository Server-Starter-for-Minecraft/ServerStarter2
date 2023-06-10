<script setup lang="ts">
import { useRouter } from 'vue-router';

interface Prop {
  name: string
  icon?: string
  label?: string
  to?: string
  disableRouter?: boolean
}
const prop = defineProps<Prop>()
const router = useRouter()

const toPath = prop.to ?? prop.name

async function to() {
  await router.push(`/${toPath}`)
}
</script>

<template>
  <q-tab
    :name="name"
    :icon="icon"
    :label="$q.screen.gt.md || $route.path===`/${toPath}` ? label : undefined"
    @click="disableRouter ? undefined : to()"
  >
    <slot/>
    <q-tooltip v-if="!($q.screen.gt.md || $route.path===`/${toPath}`)">
      {{ label }}
    </q-tooltip>
  </q-tab>
</template>