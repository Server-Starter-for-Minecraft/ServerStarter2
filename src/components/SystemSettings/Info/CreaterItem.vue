<script setup lang="ts">
interface Prop {
  job: string
  names: string[]
  twitter?: string
  github?: string
}
defineProps<Prop>()

function openLink(url: string) {
  window.API.sendOpenBrowser(url)
}
</script>

<template>
  <div class="row q-pb-md">
    <p class="q-ma-none" style="width: 12rem;">　{{ job }}</p>

    <div class="column">
      <template v-for="name in names" :key="name">
        <p class="q-ma-none" style="width: 5rem;">{{ name }}</p>
      </template>
    </div>
    
    <q-btn
      v-if="twitter"
      dense
      label="T"
      color="blue"
      @click="openLink(twitter)"
      class="q-px-sm q-mr-md"
    />
    
    <q-btn
      v-if="github"
      dense
      label="G"
      color="black"
      @click="openLink(github)"
      class="q-px-sm"
    />
  </div>
</template>