<script setup lang="ts">
interface Prop {
  settingName: string
}
defineProps<Prop>()

// TODO: MainStoreにて読み込むワールドオブジェクトを返す変数の作成後に詳細を作成
</script>

<template>
  <h1>{{ settingName }}</h1>
  <p class="text-caption">設定内容の説明</p>
</template>

<style scoped lang="scss">
h1 {
  font-size: 1.2rem;
}
</style>