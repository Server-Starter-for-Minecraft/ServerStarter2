<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { afterWindow, initWindow } from 'app/src/init';
import { useSystemStore } from 'src/stores/SystemStore';
import { OwnerDialogProp } from 'src/components/SystemSettings/General/OwnerSetter/iOwnerDialog';
import WelcomeDialog from 'src/components/App/WelcomeDialog.vue';
import OwnerDialog from 'src/components/SystemSettings/General/OwnerSetter/OwnerDialog.vue';

const $q = useQuasar();
const router = useRouter();
const sysStore = useSystemStore();

// 利用規約へ同意
if (!sysStore.systemSettings.user.eula) {
  $q.dialog({
    component: WelcomeDialog,
  }).onOk(() => {
    sysStore.systemSettings.user.eula = true;

    // オーナープレイヤーの登録催促
    $q.dialog({
      component: OwnerDialog,
      componentProps: {
        persistent: true,
      } as OwnerDialogProp,
    }).onOk(() => {
      // 起動時処理
      asyncProcess();
    });
  });
} else {
  // 起動時処理
  asyncProcess();
}

/**
 * 非同期処理によるWorldやVersionの読み込みをはじめとした起動時処理
 */
async function asyncProcess() {
  await initWindow();
  afterWindow();

  await router.replace('/');
}
</script>

<template>
  <div class="absolute-center">
    <div class="justify-center column items-center fit">
      <q-circular-progress
        indeterminate
        size="50px"
        :thickness="0.22"
        rounded
        color="primary"
        track-color="grey-3"
        class="q-ma-md"
        style="margin: auto 0"
      />

      <h1 style="font-weight: bold">{{ $t('console.init') }}</h1>
    </div>
  </div>
</template>
