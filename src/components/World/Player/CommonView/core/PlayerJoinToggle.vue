<script setup lang="ts">
import { computed } from 'vue';
import { ServerProperties } from 'app/src-electron/schema/serverproperty';

const model = defineModel<ServerProperties>({ required: true });

const playerJoinToggle = computed({
  get() {
    return model.value['white-list'] && model.value['enforce-whitelist'];
  },
  set(newValue) {
    model.value['white-list'] = newValue;
    model.value['enforce-whitelist'] = newValue;
  },
});
</script>

<template>
  <q-toggle
    v-model="playerJoinToggle"
    :label="$t('player.join')"
    style="font-size: 1rem"
  />
</template>
