<script setup lang="ts">
import { useErrorStore } from 'src/stores/ErrorStore';

const store = useErrorStore()
</script>

<template>
  <q-item class="fullscreen q-pa-md flex flex-center">
    <q-item-section avatar>
      <q-avatar icon="warning"/>
    </q-item-section>

    <q-item-section>
      <div>
        <p>ご迷惑をおかけします。</p>
        <p>{{ store.description }}</p>
        <p>こちらのエラーが頻発する場合には、以下の「バグ報告」よりエラーの報告をお願いします。</p>
        <p>なお、緊急の対応が必要な場合は、お手数をおかけしますが<a href="https://twitter.com/CivilT_T">作者CivilTT</a>までご連絡ください。</p>
      </div>

      <div>
        <p>【エラー要因】</p>
        <p>{{ store.error }}</p>
      </div>
    </q-item-section>
  </q-item>
</template>