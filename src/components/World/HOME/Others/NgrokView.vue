<script setup lang="ts">
import { useQuasar } from 'quasar';
import { useSystemStore } from 'src/stores/SystemStore';
import { useMainStore } from 'src/stores/MainStore';
import { NgrokDialogProp, NgrokDialogReturns } from './Ngrok/steps/iNgrok';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import NgrokSettingDialog from './Ngrok/NgrokSettingDialog.vue';

const $q = useQuasar()
const sysStore = useSystemStore()
const mainStore = useMainStore()

const isUseNgrok = () => sysStore.systemSettings.user.ngrokToken ?? '' !== ''

function onClick() {
  $q.dialog({
    component: NgrokSettingDialog,
    componentProps: {
      token: sysStore.systemSettings.user.ngrokToken ?? ''
    } as NgrokDialogProp
  }).onOk((p: NgrokDialogReturns) => {
    sysStore.systemSettings.user.ngrokToken = p.token
  })
}
</script>

<template>
  <p class="text-caption" style="opacity: .6;">
    「ポート開放」と呼ばれる設定をせずに，友人や外部の方をサーバーに招待するための機能です<br>
    ServerStarter2ですべてのマルチプレイの準備を整えましょう
  </p>

  <div class="row q-gutter-md">
    <SsBtn
      :label="isUseNgrok() ? 'トークンを更新する' : 'ポート開放不要の設定をする'"
      @click="onClick"
    />

    <q-toggle
      v-if="isUseNgrok()"
      v-model="mainStore.world.ngrokSetting.useNgrok"
      :label="`不要化設定を利用${mainStore.world.ngrokSetting.useNgrok ? 'する' : 'しない'}`"
    />

    <!-- デバッグ用ボタン -->
    <!-- <q-btn
      color="purple"
      label="トークンリセット"
      @click="() => sysStore.systemSettings.user.ngrokToken = ''"
    /> -->
  </div>

  <!-- 
    １．新しくDialogを立ち上げて，その中で設定を順番に進められるようにする
    ２．以下の流れで設定ができるようにする
      2-1．アカウントの新規登録 or トークンを取得済み　で分岐する
      2-2-1．アカウント新規登録の人にはそれぞれの画面を提示して，1つ終わるごとに次の画面の説明がみられるようにする
      2-2-2．すでにトークンを持っている人にはトークンを貼り付ける画面を提示する（「このトークンを保存する」の選択肢も入れる）
      2-3．登録作業が終わり次第元の画面に戻り，有効になったアドレスを表示する（次回からは機能をON/OFFにできるトグルを表示する）
   -->
</template>