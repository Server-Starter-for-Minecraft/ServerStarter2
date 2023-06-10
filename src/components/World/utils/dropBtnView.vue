<script setup lang="ts">
import { useRouter } from 'vue-router';

interface Prop {
  name: string
  label: string
  to?: string
  onClick?: () => void
}
const prop = defineProps<Prop>()
const router = useRouter()

const toPath = prop.to ?? prop.name

async function clicked() {
  await router.push(`/${toPath}`)
  if (prop.onClick) { prop.onClick() }
}
</script>

<template>
  <q-item
    :active="$route.path===`/${toPath}`"
    clickable
    @click="clicked()"
  >
    <q-item-section>{{ label }}</q-item-section>
  </q-item>
</template>