<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { afterWindow, initWindow } from 'app/src/init';
import { useSystemStore } from 'src/stores/SystemStore';
import { runFirstLaunch } from 'src/components/App/firstLaunch';
import {
  OwnerDialogProp,
  ReturnOwnerDialog,
} from 'src/components/SystemSettings/General/OwnerSetter/iOwnerDialog';
import { waitDialogClosed } from 'src/components/util/dialog';
import WelcomeDialog from 'src/components/App/WelcomeDialog.vue';
import OwnerDialog from 'src/components/SystemSettings/General/OwnerSetter/OwnerDialog.vue';

const $q = useQuasar();
const router = useRouter();
const sysStore = useSystemStore();

if (!sysStore.systemSettings.user.eula) {
  // 利用規約への同意とオーナープレイヤーの登録催促（スキップされても起動処理は続行する）
  runFirstLaunch(sysStore.systemSettings.user, {
    showWelcome: () =>
      waitDialogClosed($q.dialog({ component: WelcomeDialog })),
    showOwnerRegister: () =>
      waitDialogClosed<ReturnOwnerDialog>(
        $q.dialog({
          component: OwnerDialog,
          componentProps: {
            persistent: true,
          } as OwnerDialogProp,
        })
      ),
  }).then(() => {
    // 起動時処理
    asyncProcess();
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
