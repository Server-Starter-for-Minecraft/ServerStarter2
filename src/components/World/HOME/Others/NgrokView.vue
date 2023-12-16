<script setup lang="ts">
import { useQuasar } from 'quasar';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import NgrokSettingDialog from './Ngrok/NgrokSettingDialog.vue';

const $q = useQuasar()

function onClick() {
  $q.dialog({
    component: NgrokSettingDialog
  })
}
</script>

<template>
  <p class="text-caption" style="opacity: .6;">
    「ポート開放」と呼ばれる設定をせずに，友人や外部の方をサーバーに招待するための機能です<br>
    ServerStarter2でマルチプレイの準備をすべて完了しましょう
  </p>

  <SsBtn
    label="ポート開放不要の設定をする"
    @click="onClick"
  />
  <!-- 
    １．新しくDialogを立ち上げて，その中で設定を順番に進められるようにする
    ２．以下の流れで設定ができるようにする
      2-1．アカウントの新規登録 or トークンを取得済み　で分岐する
      2-2-1．アカウント新規登録の人にはそれぞれの画面を提示して，1つ終わるごとに次の画面の説明がみられるようにする
      2-2-2．すでにトークンを持っている人にはトークンを貼り付ける画面を提示する（「このトークンを保存する」の選択肢も入れる）
      2-3．登録作業が終わり次第元の画面に戻り，有効になったアドレスを表示する（次回からは機能をON/OFFにできるトグルを表示する）
   -->
</template>