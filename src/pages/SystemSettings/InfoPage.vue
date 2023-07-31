<script setup lang="ts">
import { useSystemStore } from 'src/stores/SystemStore';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import CreaterItem from 'src/components/SystemSettings/Info/CreaterItem.vue';

const sysStore = useSystemStore()

// TODO: 本来はこのオプションをバックエンドから取得する
const latest = false

// TODO: installerのダウンロードなどを行い、システムをアップデートするための準備を行う
function systemUpdate() {

}

function openLink(url: string) {
  window.API.sendOpenBrowser(url)
}
</script>

<template>
  <div class="q-px-md" style="margin: auto; width: fit-content;">
    <h1 class="q-pt-md">システムバージョン</h1>
    <div class="row items-center">
      <p class="q-ma-none">{{ sysStore.systemVersion }}</p>
      <div class="q-ml-md">
        <p v-if="latest">(最新)</p>
        <SsBtn v-else free-width label="最新版に更新" color="primary" @click="systemUpdate" />
      </div>
    </div>
    <!-- TODO: 最終更新日を取得＆保存 -->
    <div class="text-caption q-pt-sm" style="opacity: .6;">最終更新日：2023年8月1日火曜日　0:00:00</div>

    <h1>外部リンク</h1>
    <div class="row">
      <p class="q-ma-none" style="width: 12rem;">　公式ホームページ</p>
      <a href="javascript:void(0)" @click="openLink('https://civiltt.github.io/ServerStarter/')"
        class="text-primary text-body2">
        https://civiltt.github.io/ServerStarter/
      </a>
    </div>
    <div class="row q-pt-sm">
      <p class="q-ma-none" style="width: 12rem;">　お問い合わせ</p>
      <div class="row" style="flex: 1 1 0">
        <a href="javascript:void(0)" @click="openLink('https://twitter.com/CivilT_T')" class="text-primary text-body2">
          https://twitter.com/CivilT_T
        </a>
        <span>（DMよりご連絡ください）</span>
      </div>
    </div>

    <h1>ライセンス</h1>
    <p class="text-bold q-ma-none">MIT License (CivilTT, txkodo)</p>
    <div class="text-caption q-pt-sm" style="opacity: .6;">
      制作者への許可なくシステムを改変して再配布することを禁じています。<br>
      詳細はServerStarter2の利用規約、並びにライセンス条項をご確認ください。
    </div>

    <h1>製作者</h1>
    <CreaterItem
      job="製作責任者"
      :names="['CivilTT']"
      twitter="https://twitter.com/CivilT_T"
      github="https://github.com/CivilTT"
    />
    <CreaterItem
      job="技術責任者"
      :names="['txkodo']"
      twitter="https://twitter.com/txkodo"
      github="https://github.com/txkodo"
    />
    <CreaterItem
      job="実装補助"
      :names="['nozz', 'Monchi']"
    />
  </div>
</template>