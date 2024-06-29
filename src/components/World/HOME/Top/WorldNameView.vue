<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { isError } from 'app/src-public/scripts/error';
import { WorldName } from 'app/src-electron/schema/brands';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';
import SsInput from 'src/components/util/base/ssInput.vue';

const mainStore = useMainStore();
const consoleStore = useConsoleStore();
const { t } = useI18n();

/**
 * ワールド名のバリデーションを行う
 */
async function validateWorldName(name: WorldName) {
  if (!mainStore.world) {
    return true;
  }

  const res = await window.API.invokeValidateNewWorldName(
    mainStore.world.container,
    name
  );
  if (isError(res) && mainStore.world.name !== name) {
    mainStore.errorWorlds.add(mainStore.selectedWorldID);
    return t(`error.${res.key}.desc`);
  } else {
    mainStore.errorWorlds.delete(mainStore.selectedWorldID);
    mainStore.world.name = name;
    return true;
  }
}

/**
 * ワールド名の入力欄で取り消しボタンが押された際に、ワールドを起動できなくするためのエラー処理
 */
function clearNewName() {
  // 空文字列のワールドは起動できないため、エラー扱い
  mainStore.errorWorlds.add(mainStore.selectedWorldID);
}
</script>

<template>
  <SsInput
    v-model="mainStore.inputWorldName"
    :label="$t('home.worldName.enterName')"
    :debounce="200"
    :disable="consoleStore.status(mainStore.selectedWorldID) !== 'Stop'"
    :rules="[(val) => validateWorldName(val)]"
    @clear="clearNewName"
  />
</template>
