<script setup lang="ts">
import { Remote } from 'app/src-electron/schema/remote';
import { useSystemStore } from 'src/stores/SystemStore';
import { useMainStore } from 'src/stores/MainStore';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import DangerView from 'src/components/util/danger/dangerView.vue';
import SsA from 'src/components/util/base/ssA.vue';
import GithubCard from 'src/components/SystemSettings/Remote/github/GithubCard.vue';

interface Prop {
  remote: Remote
}
const prop = defineProps<Prop>()

const sysStore = useSystemStore()
const mainStore = useMainStore()
const consoleStore = useConsoleStore()
const remoteURL = `https://github.com/${prop.remote.folder.owner}/${prop.remote.folder.repo}/tree/${prop.remote.name}`

function deleteRemoteSetting() {
  if (mainStore.world.remote !== void 0) {
    sysStore.systemSettings.remote.splice(
      sysStore.systemSettings.remote.map(
        r => r.folder
      ).indexOf(
        prop.remote.folder
      ),
      1
    )
  }
}
</script>

<template>
  <h1 class="q-pt-md">{{ $t('shareWorld.existRemote.syncWorldTitle') }}</h1>
  <p class="text-body2" style="opacity: .6;">
    <i18n-t keypath="shareWorld.existRemote.syncWorldDesc" tag="false">
      {{ `${remote.folder.owner}/${remote.folder.repo}/${remote.name}` }}
      <br>
      <SsA :url="remoteURL" class="text-body2 text-primary">
        {{ $t('shareWorld.github') }}
      </SsA>
    </i18n-t>
  </p>
  
  <GithubCard
    v-model="sysStore.systemSettings.remote.filter(
      r => (r.folder.owner === remote.folder.owner && r.folder.repo === remote.folder.repo)
    )[0]"
    :world-name="remote.name"
    :disable="consoleStore.status(mainStore.world.id) !== 'Stop'"
    style="width: max-content;"
  />

  <DangerView
    :view-title="$t('shareWorld.existRemote.unregister.unregistSyncTitle')"
    :view-desc="
      $t(
        'shareWorld.existRemote.unregister.unregistSyncDesc',
        {
          remotePath: `${remote.folder.owner}/${remote.folder.repo}/${remote.name}`, 
          worldName: `${mainStore.world.name}`
        }
      )
    "
    :open-dialog-btn-text="$t('shareWorld.existRemote.unregister.unregistSyncTitle')"
    :dialog-title="$t('shareWorld.existRemote.unregister.dialogTitle')"
    :dialog-desc="$t('shareWorld.existRemote.unregister.dialogDesc')"
    :disable="consoleStore.status(mainStore.world.id) !== 'Stop'"
    @action="mainStore.world.remote = undefined"
  />

  <DangerView
    :view-title="$t('shareWorld.existRemote.delete.title')"
    :view-desc="$t('shareWorld.existRemote.delete.desc',{remotePath: `${remote.folder.owner}/${remote.folder.repo}/${remote.name}`})"
    :open-dialog-btn-text="$t('shareWorld.existRemote.delete.btn')"
    :dialog-title="$t('shareWorld.existRemote.delete.dialogTitle')"
    :dialog-desc="$t('shareWorld.existRemote.delete.dialogDesc')"
    :disable="consoleStore.status(mainStore.world.id) !== 'Stop'"
    @action="deleteRemoteSetting()"
  />
</template>