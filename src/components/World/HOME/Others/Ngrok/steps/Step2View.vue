<script setup lang="ts">
import { ref } from 'vue';
import { assets } from 'src/assets/assets';
import SsA from 'src/components/util/base/ssA.vue';
import BaseCard from './slides/BaseCard.vue';

const slide = ref(1)
</script>

<template>
  <div>
    <p class="text-caption">
      画面に沿ってアカウント登録を完了しましょう！
    </p>
    
    <q-carousel
      v-model="slide"
      animated
      transition-prev="slide-right"
      transition-next="slide-left"
      control-color="primary"
      navigation
      padding
      arrows
      class="text-white shadow-1 rounded-borders"
    >
      <q-carousel-slide :name="1">
        <BaseCard title="アカウント登録" :img="assets.png.signUp" :img-width="9">
          <p>
            Ngrokのアカウント登録は
            <SsA url="https://dashboard.ngrok.com/signup">
              こちらの登録画面で行います
            </SsA>
          </p>
          <p>任意のユーザー名，メールアドレス，パスワードを記入してSign upをクリックしましょう！</p>
        </BaseCard>
      </q-carousel-slide>
      <q-carousel-slide :name="2">
        <BaseCard title="Eメールの認証" :img="assets.png.verifyEmail" :img-width="16">
          <p>登録したE-mailにNgrokよりメールが届くため，メールに記載されたURLをクリックして認証を完了しましょう</p>
        </BaseCard>
      </q-carousel-slide>
      <q-carousel-slide :name="3">
        <BaseCard title="アンケートへ回答" :img="assets.png.welcome" :img-width="10">
          <p>これで登録は完了ですが，最後にNgrokからのアンケートを画像に倣って回答をお願いします</p>
        </BaseCard>
      </q-carousel-slide>
      <q-carousel-slide :name="4">
        <BaseCard title="接続方法" :img="assets.png.mcInput" :img-width="10">
          <p>ServerStarter2でサーバーを起動すると画面の右上に<span class="text-negative">起動ごとに値が変更される</span>IPアドレスが表示されます</p>
          <p>このアドレスをMinecraftのマルチプレイサーバーのアドレス欄に入力することで，サーバーに接続することができます！</p>
        </BaseCard>
      </q-carousel-slide>
    </q-carousel>
  </div>
</template>