<script setup lang="ts">
interface Prop {
  name: string
  desc?: string
  actionType: 'delete' | 'add'
  color?: string
}
defineProps<Prop>()
</script>

<template>
  <q-card flat class="card" :style="{'background': color}">
    <q-card-section>
      <h1 class="q-py-none q-my-none title-text">{{ name }}</h1>
      <div v-if="desc !== void 0" class="text-caption q-pt-md">{{ desc }}</div>
    </q-card-section>
    <div class="text-h5 absolute-bottom text-right">
      <q-btn v-show="actionType === 'delete'" flat color="grey" size="1.1rem" icon="delete"/>
      <q-btn v-show="actionType === 'add'" flat color="grey" size="1.1rem" icon="add"/>
    </div>
  </q-card>
</template>

<style scoped lang="scss">
h1 {
  font-size: 2rem;
}

.card {
  width: 100%;
  max-width: 280px;
}

.title-text {
  overflow-wrap: break-word;
}
</style>