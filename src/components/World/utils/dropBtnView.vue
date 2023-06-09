<script setup lang="ts">
import { useRouter } from 'vue-router';

interface Prop {
  name: string
  label: string
  to?: string
}
const prop = defineProps<Prop>()
const router = useRouter()

const toPath = prop.to ?? prop.name

async function to() {
  await router.push(`/${toPath}`)
}
</script>

<template>
  <q-item
    :active="$route.path===`/${toPath}`"
    clickable
    @click="to()"
  >
    <q-item-section>{{ label }}</q-item-section>
  </q-item>
</template>