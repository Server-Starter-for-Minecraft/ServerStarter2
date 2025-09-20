<script setup lang="ts">
import SsInput from 'src/components/util/base/ssInput.vue';

const model = defineModel<string>({ required: false });
</script>

<template>
  <div>
    <span class="text-caption">{{ $t('owner.searchPlayer') }}</span>
    <SsInput
      v-model="model"
      dense
      :placeholder="$t('player.search')"
      :debounce="200"
      class="q-pb-md col"
    />
  </div>
</template>
