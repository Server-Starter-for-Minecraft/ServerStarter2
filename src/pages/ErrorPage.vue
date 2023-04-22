<script setup lang="ts">
import { useErrorStore } from 'src/stores/ErrorStore';

const store = useErrorStore()

function showTwitter() {
  window.API.sendOpenBrowser('https://twitter.com/CivilT_T')
}
</script>

<template>
  <div class="fullscreen justify-center flex flex-center">
    <q-card flat class="bg-transparent">
      <q-card-section horizontal>
        <q-card-section class="col-2 flex flex-center">
          <q-icon name="warning" color="orange" size="5rem"/>
        </q-card-section>
    
        <q-card-section>
          <div>
            <p>ご迷惑をおかけします。</p>
            <p style="text-decoration: underline;">{{ store.description }}</p>
            <p>こちらのエラーが頻発する場合には、以下の「バグ報告」よりエラーの報告をお願いします。</p>
            <p>なお、緊急の対応が必要な場合は、お手数をおかけしますがTwitterにて作者CivilTTまでご連絡ください。</p>
          </div>
    
          <div>
            <p>【エラー要因】</p>
            <p>{{ store.error }}</p>
          </div>
        </q-card-section>
      </q-card-section>

      <q-card-actions class="justify-center">
        <q-btn color="red" icon="pest_control" label="バグ報告" size="1.3rem" class="q-mx-md"/>
        <q-btn color="blue-1" text-color="blue" icon="img:https://cdn.iconscout.com/icon/free/png-512/free-twitter-87-432551.png?f=avif&w=256" label="作者へ連絡" size="1.3rem" class="q-mx-md" @click="showTwitter"/>
        <q-btn icon="close" label="閉じる" size="1.3rem" class="q-mx-md"/>
      </q-card-actions>
    </q-card>
  </div>
</template>