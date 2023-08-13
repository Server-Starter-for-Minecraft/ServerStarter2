<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { useSystemStore } from 'src/stores/SystemStore';
import { useMainStore } from 'src/stores/MainStore';
import { RemoteFolder } from 'app/src-electron/schema/remote';
import { checkError } from 'src/components/Error/Error';
import GithubCard from 'src/components/SystemSettings/Remote/github/GithubCard.vue';
import AddContentsCard from 'src/components/util/AddContentsCard.vue';
import NewRemoteDialog from 'src/components/SystemSettings/Remote/NewRemoteDialog.vue';

const $q = useQuasar()
const sysStore = useSystemStore()
const mainStore = useMainStore()

const loading = ref(false)

function addRemote() {
  $q.dialog({
    component: NewRemoteDialog
  })
}

async function registerRemoteAccount(remoteData: RemoteFolder) {
  // TODO: github以外に対応した場合は条件分岐を入れる
  // TODO: remoteDataから生成する場合、branchキーに何を入れるのか？
  // --> 基本的にはワールド名だが、新規でリモートを登録する際にはbranch名をユーザーが変更できるようなモーダルを挟む
  // remote_sourceには既存のリモートワールドを導入する際にそのワールドの登録情報を入れる
  // remoteには新規のリモートと既存のリモートの登録情報を入れる
  console.log('### TODO: 登録処理の実装 ###')



  // ファイルを読み込み中のステータスに変更
  loading.value = true

  // 既存のShareWorldを取得
  const res = await window.API.invokeGetRemoteWorlds(remoteData)
  checkError(
    res.value,
    remotes => mainStore.gotRemoteWorlds = remotes,
    () => { return { title: 'ShareWorldの取得に失敗しました' } }
  )

  // 読み込み中のステータスを解除
  loading.value = false
}
</script>

<template>
  <h1 class="q-py-xs">{{ $t('shareWorld.registerNewRemote') }}</h1>
  <q-scroll-area style="width: 100%; height: calc(220px + 6rem);">
    <div class="row q-gutter-md no-wrap" style="margin: auto;">
      <div>
        <!-- 13remはssBtnの固定サイズ、24pxは片側余白幅 -->
        <AddContentsCard
          :label="$t('shareWorld.addRemote.title')"
          min-height="250px"
          :card-style="{ 'border-radius': '6px' }"
          @click="addRemote"
          style="min-width: calc(13rem + 24px * 2);"
        />
      </div>
      <div v-for="n in sysStore.systemSettings.remote.length" :key="sysStore.systemSettings.remote[n-1].pat">
        <GithubCard
          v-model="sysStore.systemSettings.remote[n-1]"
          @register-click="registerRemoteAccount"
        />
      </div>
    </div>
  </q-scroll-area>
</template>