<script setup lang="ts">
import SsInput from 'src/components/util/base/ssInput.vue';
import SsSelect from 'src/components/util/base/ssSelect.vue';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';

const mainStore = useMainStore()
const consoleStore = useConsoleStore()
</script>

<template>
  <span class="text-caption">{{ $t('home.setting.memSize') }}</span>
  <div class="row" style="max-width: 350px;">
    <SsInput
      v-model="mainStore.world.memory.size"
      dense
      :disable="consoleStore.status(mainStore.world.id) !== 'Stop'"
      class="col-4 q-pr-md"
    />
    <SsSelect
      v-model="mainStore.world.memory.unit"
      dense
      :options="['MB', 'GB', 'TB']"
      :disable="consoleStore.status(mainStore.world.id) !== 'Stop'"
      class="col-3"
    />
  </div>
  <SsInput
    v-model="mainStore.world.javaArguments"
    :label="$t('home.setting.jvmArgument')"
    :disable="consoleStore.status(mainStore.world.id) !== 'Stop'"
    class="q-pt-lg"
  />
</template>