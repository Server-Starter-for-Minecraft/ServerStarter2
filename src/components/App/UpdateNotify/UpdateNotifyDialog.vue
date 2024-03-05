<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { UpdateNotifyProp } from './iUpdateNotifyDialog';
import { useSystemStore } from 'src/stores/SystemStore';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import BaseDialogCard from 'src/components/util/baseDialog/baseDialogCard.vue';
import ssA from 'src/components/util/base/ssA.vue';
import { ref } from 'vue';

defineEmits({ ...useDialogPluginComponent.emitsObject });
const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } =
  useDialogPluginComponent();
const prop = defineProps<UpdateNotifyProp>();

const isAutoUpdate = prop.os !== 'linux';

const sysStore = useSystemStore();
const tmp = ref(true);
</script>

<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <BaseDialogCard
      title="最新版へアップデート"
      :ok-btn-txt="
        isAutoUpdate ? 'アップデートを開始する' : 'インストーラーをダウンロード'
      "
      @ok-click="onDialogOK"
    >
      <template #additionalBtns>
        <SsBtn
          v-if="!required"
          label="アップデートを行わない"
          @click="onDialogCancel"
        />
      </template>
      <div v-if="isAutoUpdate" style="font-size: 0.8rem; opacity: 0.6">
        ServerStarter2のアップデートを開始します<br />
        最新版のServerStarter2を使ってより快適にマルチプレイを楽しみましょう！<br /><br />
        ※アップデート後にこの画面が繰り返し表示される場合は，<ssA
          url="https://server-starter-for-minecraft.github.io"
          >公式HP</ssA
        >より再インストールをお願いします！
      </div>
      <div v-else style="font-size: 0.8rem; opacity: 0.6">
        ServerStarter2の最新版が新しくリリースされました！<br />
        最新のインストーラーをダウンロードし，新しいServerStarter2を手に入れましょう！
      </div>
      <!-- TODO: `sysStore.systemSettings.user.rejectUpdateNotify`に差し替える -->
      <q-checkbox
        v-if="!required"
        v-model="tmp"
        label="次の最新版がリリースされるまでこの通知を表示しない"
        class="q-pt-md"
      />
    </BaseDialogCard>
  </q-dialog>
</template>
