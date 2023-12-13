<script setup lang="ts">
import SsA from 'src/components/util/base/ssA.vue';
import SsInput from 'src/components/util/base/ssInput.vue';

const authToken = defineModel<string>({ required: true })
</script>

<template>
  <div>
    <p class="text-caption">
      NgrokアカウントとServerStarter2を紐づけます<br>
      <SsA url="https://dashboard.ngrok.com/get-started/your-authtoken">
        認証トークンを取得するウェブページ
      </SsA>
      を開き，表示されたトークンを下に入力してください
    </p>

    <SsInput
      v-model="authToken"
      placeholder="トークンを入力"
      secret
    />  
  </div>
</template>