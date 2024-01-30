<script setup lang="ts">
import { useQuasar } from 'quasar';
import { useSystemStore } from 'src/stores/SystemStore';
import { useMainStore } from 'src/stores/MainStore';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { RemoteFolder } from 'app/src-electron/schema/remote';
import { GitHubSelecterProp } from './selecters/iRemoteSelecter';
import GitHubSelecterDialog from './selecters/github/GitHubSelecterDialog.vue';
import GithubCard from 'src/components/SystemSettings/Remote/github/GithubCard.vue';
import AddContentsCard from 'src/components/util/AddContentsCard.vue';
import NewRemoteDialog from 'src/components/SystemSettings/Remote/NewRemoteDialog.vue';

const $q = useQuasar();
const sysStore = useSystemStore();
const mainStore = useMainStore();
const consoleStore = useConsoleStore();

function addRemote() {
  $q.dialog({
    component: NewRemoteDialog,
  });
}

async function registerRemoteAccount(remoteData: RemoteFolder) {
  $q.dialog({
    component: GitHubSelecterDialog,
    componentProps: {
      remoteData: remoteData,
    } as GitHubSelecterProp,
  });
}
</script>

<template>
  <h1 class="q-py-xs">{{ $t('shareWorld.registerNewRemote') }}</h1>
  <div class="row q-gutter-md q-py-sm">
    <div>
      <!-- 13remはssBtnの固定サイズ、24pxは片側余白幅 -->
      <AddContentsCard
        :label="$t('shareWorld.addRemote.title')"
        min-height="250px"
        :card-style="{ 'border-radius': '6px' }"
        @click="addRemote"
        style="min-width: calc(13rem + 24px * 2)"
      />
    </div>
    <div
      v-for="n in sysStore.systemSettings.remote.length"
      :key="sysStore.systemSettings.remote[n - 1].pat"
    >
      <GithubCard
        v-model="sysStore.systemSettings.remote[n - 1]"
        :disable="consoleStore.status(mainStore.world.id) !== 'Stop'"
        @register-click="registerRemoteAccount"
      />
    </div>
  </div>
</template>
