<script setup lang="ts">
import { useSystemStore } from 'src/stores/SystemStore';
import GithubCard from 'src/components/SystemSettings/Remote/github/GithubCard.vue';
import AddContentsCard from 'src/components/util/AddContentsCard.vue';
import { values } from 'src/scripts/obj';

const sysStore = useSystemStore()

// TEMP
sysStore.remoteSettings().github['CivilTT/共有世界'] = { owner: 'CivilTT', repo: '共有世界', pat: 'abcde' }

function addRemote() {
  console.log('### TODO: ここに登録処理を実装 ###')
}
</script>

<template>
  <div class="q-pa-md">
    <p class="q-my-sm text-body2" style="opacity: .6;">
      ワールド共有機能（ShareWorld）を利用するためのデータ保管場所を登録します<br>
      ShareWorldは複数人でサーバーを開く際に、誰が開いても常に最新のワールドを遊べるようにするための機能です。
    </p>
  
    <div class="row">
      <div class="row q-py-md q-gutter-md">
        <div>
          <!-- 13remはssBtnの固定サイズ、24pxは片側余白幅 -->
          <AddContentsCard
            label="リモートを追加"
            min-height="250px"
            :card-style="{ 'border-radius': '6px' }"
            @click="addRemote"
            style="min-width: calc(13rem + 24px * 2);"
          />
        </div>
        <div v-for="remoteData in values(sysStore.remoteSettings().github)" :key="remoteData.owner">
          <GithubCard :remote="remoteData" />
        </div>
      </div>
    </div>
  </div>
</template>