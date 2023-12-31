<script setup lang="ts">
interface Prop {
  onClick?: () => void
}
defineProps<Prop>()
</script>

<template>
  <q-card
    flat
    bordered
    class="fit card"
  >
    <!-- <dev @click="onClick" @mouseover="() => hovered = true" @mouseleave="() => hovered = false" style="cursor: pointer; transition: opacity: .3s;" class="fit card" :class="hovered ? 'test' : ''" >
      <slot />
    </dev> -->
    
    <!-- <q-btn dense no-caps @click="onClick" @mouseHovered="() => hovered = true" style="cursor: pointer; font-weight: inherit;" class="fit card q-pa-none" >
      <slot />
      <slot name="actions" />
    </q-btn> -->

    <q-item
      dense
      :clickable="onClick !== void 0"
      @click="onClick"
      class="q-pa-none column fit"
      style="color: inherit;"
    >
      <slot />
      <slot name="actions" />
    </q-item>
    
    <!-- <slot /> -->

    <!-- <div v-if="onClick !== void 0" class="absolute-top fit">
      <q-btn flat color="transparent" @click="onClick" class="fit"/>
    </div> -->

  </q-card>
</template>

<style scoped lang="scss">
.card {
  min-width: 14rem;
  max-width: 14rem;
  border-radius: 15px;
}

.test {
  transition: opacity .3s;
}
</style>