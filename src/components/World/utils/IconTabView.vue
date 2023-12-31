<script setup lang="ts">
import { useRouter } from 'vue-router';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';

interface Prop {
  path: string
  icon?: string
  label?: string
  disableRouter?: boolean
}
const prop = defineProps<Prop>()
const router = useRouter()

async function to() {
  await router.push(`/${prop.path}`)
}
</script>

<template>
  <q-tab
    :name="`/${path}`"
    :icon="icon"
    :label="$q.screen.gt.md || $route.path===`/${path}` ? label : undefined"
    @click="disableRouter ? undefined : to()"
  >
    <slot/>
    <SsTooltip
      v-if="!($q.screen.gt.md || $route.path===`/${path}`) && label"
      :name="label"
      anchor="center middle"
      self="top middle"
    />
  </q-tab>
</template>