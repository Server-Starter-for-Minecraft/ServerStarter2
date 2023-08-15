<script setup lang="ts">
import { Remote } from 'app/src-electron/schema/remote';
import { useSystemStore } from 'src/stores/SystemStore';
import { useMainStore } from 'src/stores/MainStore';
import DangerView from 'src/components/util/danger/dangerView.vue';
import SsA from 'src/components/util/base/ssA.vue';
import GithubCard from 'src/components/SystemSettings/Remote/github/GithubCard.vue';

interface Prop {
  remote: Remote
}
const prop = defineProps<Prop>()

const sysStore = useSystemStore()
const mainStore = useMainStore()
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
  <h1 class="q-pt-md">同期中のShareWorldデータ</h1>
  <p class="text-body2" style="opacity: .6;">
    このワールドは{{ `${remote.folder.owner}/${remote.folder.repo}/${remote.name}` }}と同期されています<br>
    <SsA :url="remoteURL" class="text-body2 text-primary">GitHub</SsA>ではこの同期データをブラウザ上で確認することができます
  </p>
  
  <GithubCard
    v-model="sysStore.systemSettings.remote.filter(
      r => (r.folder.owner === remote.folder.owner && r.folder.repo === remote.folder.repo)
    )[0]"
    :world-name="remote.name"
    style="width: max-content;"
  />

  <DangerView
    view-title="ワールドの同期を解除"
    :view-desc="`
      ${remote.folder.owner}/${remote.folder.repo}/${remote.name}との同期を解除します<br>
      ShareWorldが削除されることはありませんが、${mainStore.world.name}の更新データは共有されなくなります`"
    open-dialog-btn-text="ワールドの同期を解除"
    dialog-title="同期を解除します"
    dialog-desc="同期を解除すると、これ以降にこのサーバーで遊んだ内容は同期されません<br>共有を解除しますか？"
    @action="mainStore.world.remote = undefined"
  />

  <DangerView
    view-title="ShareWorldを削除する"
    :view-desc="`
      ${remote.folder.owner}/${remote.folder.repo}/${remote.name}の共有データを完全に削除します<br>
      共有しているShareWorldのデータは削除されますが、全ての参加者はローカルワールドとして引き続きこのワールドを起動することができます`"
    open-dialog-btn-text="ShareWorldを削除"
    dialog-title="リモートデータを削除します"
    dialog-desc="このワールドはShareWorldのデータが削除されるため、共有相手も同期が解除されます<br>このワールドのShareWorldデータを削除しますか？"
    @action="deleteRemoteSetting()"
  />
</template>