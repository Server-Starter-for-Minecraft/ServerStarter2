<script setup lang="ts">
interface Prop {
  job: string;
  names: string[];
  url?: string;
}
defineProps<Prop>();

function openLink(url: string) {
  window.API.sendOpenBrowser(url);
}
</script>

<template>
  <div class="row q-pb-md">
    <p class="q-ma-none" style="width: 10rem">{{ job }}</p>

    <div class="column">
      <template v-for="name in names" :key="name">
        <a
          v-if="url"
          href="javascript: void(0)"
          @click="openLink(url)"
          class="q-ma-none text-primary"
          style="width: 5rem; font-size: 1rem"
        >
          {{ name }}
        </a>
        <p v-else class="q-ma-none" style="width: 5rem">{{ name }}</p>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.logoBtn {
  width: 1.7rem;
  min-height: 1.7rem;
  max-height: 1.7rem;
}
</style>
