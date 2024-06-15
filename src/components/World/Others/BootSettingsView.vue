<script setup lang="ts">
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';
import SsInput from 'src/components/util/base/ssInput.vue';
import SsSelect from 'src/components/util/base/ssSelect.vue';

const mainStore = useMainStore();
const consoleStore = useConsoleStore();
</script>

<template>
  <span class="text-caption">{{ $t('home.setting.memSize') }}</span>
  <div v-if="mainStore.world" class="row" style="max-width: 350px">
    <SsInput
      v-model.number="mainStore.world.memory.size"
      type="number"
      dense
      :disable="consoleStore.status(mainStore.selectedWorldID) !== 'Stop'"
      class="col-5 q-pr-md"
    />
    <SsSelect
      v-model="mainStore.world.memory.unit"
      dense
      :options="['MB', 'GB', 'TB']"
      :disable="consoleStore.status(mainStore.selectedWorldID) !== 'Stop'"
      class="col-3"
    />
  </div>
  <SsInput
    v-if="mainStore.world"
    v-model="mainStore.world.javaArguments"
    :label="$t('home.setting.jvmArgument')"
    :disable="consoleStore.status(mainStore.selectedWorldID) !== 'Stop'"
    class="q-pt-lg"
  />
</template>
