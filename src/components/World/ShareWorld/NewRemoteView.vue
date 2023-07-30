<script setup lang="ts">
import { useQuasar } from 'quasar';
import { values } from 'src/scripts/obj';
import { useSystemStore } from 'src/stores/SystemStore';
import { useMainStore } from 'src/stores/MainStore';
import { GithubAccountSetting } from 'app/src-electron/schema/remote';
import GithubCard from 'src/components/SystemSettings/Remote/github/GithubCard.vue';
import AddContentsCard from 'src/components/util/AddContentsCard.vue';
import NewRemoteDialog from 'src/components/SystemSettings/Remote/NewRemoteDialog.vue';

const $q = useQuasar()
const sysStore = useSystemStore()
const mainStore = useMainStore()

function addRemote() {
  $q.dialog({
    component: NewRemoteDialog
  })
}

function registerRemote(remoteData: GithubAccountSetting) {
  // TODO: github以外に対応した場合は条件分岐を入れる
  // TODO: remoteDataから生成する場合、branchキーに何を入れるのか？
  // --> 基本的にはワールド名だが、新規でリモートを登録する際にはbranch名をユーザーが変更できるようなモーダルを挟む
  // remote_sourceには既存のリモートワールドを導入する際にそのワールドの登録情報を入れる
  // remoteには新規のリモートと既存のリモートの登録情報を入れる
  console.log('### TODO: 登録処理の実装 ###')
}
</script>

<template>
  <h1 class="q-py-xs">{{ $t('shareWorld.registerNewRemote') }}</h1>
  <q-scroll-area style="width: 100%; height: calc(220px + 6rem);">
    <div class="row q-gutter-md no-wrap" style="margin: auto;">
      <div>
        <!-- 13remはssBtnの固定サイズ、24pxは片側余白幅 -->
        <AddContentsCard :label="$t('shareWorld.addRemote.title')" min-height="250px"
          :card-style="{ 'border-radius': '6px' }" @click="addRemote" style="min-width: calc(13rem + 24px * 2);" />
      </div>
      <div v-for="remoteData in values(sysStore.remoteSettings.github)" :key="remoteData.owner">
        <GithubCard :remote="remoteData" @register-click="registerRemote(remoteData)" />
      </div>
    </div>
  </q-scroll-area>
</template>