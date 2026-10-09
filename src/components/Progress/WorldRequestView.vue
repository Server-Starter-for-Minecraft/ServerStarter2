<!--
  表示中のワールドに対するユーザーへの要求（EULAへの同意など）の回答画面

  どのワールドへの要求かが分かるように、ワールドの編集画面の上にのみ背景を暗くして表示する。
  ワールド一覧は操作できるため、別のワールドやシステム設定画面に切り替えると非表示になり、
  再度そのワールドを表示した際に改めて表示される。
-->
<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useMainStore } from 'src/stores/MainStore';
import {
  useWorldRequestStore,
  WorldRequestTypes,
} from 'src/stores/WorldRequestStore';
import { promptOf } from './worldRequestPrompt';

const route = useRoute();
const mainStore = useMainStore();
const requestStore = useWorldRequestStore();

/** 表示中のワールドの回答待ちの要求（システム設定画面の表示中は表示しない） */
const request = computed(() => {
  if (route.path.startsWith('/system')) return undefined;
  const worldID = mainStore.selectedWorldID;
  const pending = requestStore.pending(worldID);
  return pending && { worldID, pending, prompt: promptOf(pending) };
});

/** 回答画面からの回答を、要求元に返す */
function onAnswer(
  answer: WorldRequestTypes[keyof WorldRequestTypes]['answer']
) {
  if (request.value === undefined) return;
  const { worldID, pending } = request.value;
  requestStore.answer(worldID, pending.kind, answer);
}

// 回答画面を表示したら、背後の画面（コンソールの入力欄など）からフォーカスを移し、
// キーボードで背後の画面を操作できないようにする
const backdropRef = ref<HTMLElement>();
watch(
  () => request.value?.worldID,
  async (worldID) => {
    if (worldID === undefined) return;
    await nextTick();
    backdropRef.value?.focus();
  },
  { immediate: true }
);
</script>

<template>
  <transition name="q-transition--fade">
    <!-- 別のワールドに切り替えた場合は、回答画面を作り直す -->
    <div
      v-if="request"
      :key="request.worldID"
      ref="backdropRef"
      class="absolute-full flex flex-center backdrop"
      role="dialog"
      tabindex="-1"
    >
      <component
        :is="request.prompt.component"
        v-bind="request.prompt.props"
        class="prompt"
        @answer="onAnswer"
      />
    </div>
  </transition>
</template>

<style scoped lang="scss">
// 背景の暗さはQuasarのダイアログの背景に合わせる
.backdrop {
  z-index: 100;
  background: rgba(0, 0, 0, 0.4);
  outline: none;
}

.prompt {
  width: calc(100% - 48px);
  max-width: 560px;
  max-height: calc(100% - 48px);
  overflow: auto;
}
</style>
