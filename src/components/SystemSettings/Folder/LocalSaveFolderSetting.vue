<script setup lang="ts">
import { computed, onMounted, Ref, ref } from 'vue';
import { tError } from 'src/i18n/utils/tFunc';
import { useSystemStore } from 'src/stores/SystemStore';
import { checkError } from 'src/components/Error/Error';
import AddContentsCard from 'src/components/util/AddContentsCard.vue';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';

const sysStore = useSystemStore();

/** Minecraft Launcherの設定から自動検出した読み込み先(編集不可) */
const detectedFolders: Ref<string[]> = ref([]);

/**
 * 画面に表示する読み込み先の一覧
 *
 * 自動検出した読み込み先(index なし)の後に，ユーザーが追加した読み込み先(設定内の位置を index に持つ)を並べる
 */
const folders = computed(() => [
  ...detectedFolders.value.map((path) => ({
    path,
    detected: true,
    index: undefined,
  })),
  ...sysStore.systemSettings.localSave.containers.map((path, index) => ({
    path,
    detected: false,
    index,
  })),
]);

onMounted(async () => {
  detectedFolders.value =
    await window.API.invokeGetDetectedLocalSaveContainers();
});

/**
 * エクスプローラーでフォルダを開く
 * @param path 開くフォルダのパス
 */
async function openFolder(path: string) {
  const res = await window.API.sendOpenFolder(path, false);
  checkError(res, undefined, (e) => tError(e));
}

/**
 * フォルダ選択ダイアログで選んだフォルダを読み込み先に追加する
 */
async function addFolder() {
  const res = await window.API.invokePickDialog({ type: 'container' });
  checkError(
    res,
    (path) => {
      // 自動検出済み・追加済みのフォルダは重複して登録しない
      const containers = sysStore.systemSettings.localSave.containers;
      if (!containers.includes(path) && !detectedFolders.value.includes(path))
        containers.push(path);
    },
    (e) => tError(e, { ignoreErrors: ['data.path.dialogCanceled'] })
  );
}

/**
 * 追加した読み込み先を一覧から削除する(フォルダ自体は削除しない)
 * @param index 削除する読み込み先の番号
 */
function removeFolder(index: number) {
  sysStore.systemSettings.localSave.containers.splice(index, 1);
}
</script>

<template>
  <div>
    <h1 class="q-mt-none">
      {{ $t('systemsetting.folder.localSave.title') }}
    </h1>
    <p class="q-my-sm text-body2" style="opacity: 0.6; white-space: pre-line">
      {{ $t('systemsetting.folder.localSave.desc') }}
    </p>

    <div class="column q-py-sm q-gutter-y-md">
      <q-card
        v-for="folder in folders"
        :key="`${folder.detected}-${folder.path}`"
        flat
        bordered
        class="card"
      >
        <div class="row items-center no-wrap q-px-md q-py-sm q-gutter-x-sm">
          <!-- パスが長い場合は省略表示し，操作ボタンが画面外に出ないようにする -->
          <div class="col text-omit" style="width: 0">
            {{ folder.path }}
            <SsTooltip
              :name="folder.path"
              anchor="bottom start"
              self="center start"
            />
          </div>
          <q-badge
            v-if="folder.detected"
            outline
            color="primary"
            :label="$t('systemsetting.folder.localSave.detected')"
          />
          <SsBtn
            dense
            free-width
            icon="folder_open"
            @click="openFolder(folder.path)"
          >
            <SsTooltip
              :name="$t('others.worldFolder.openFolder')"
              anchor="bottom middle"
              self="center middle"
            />
          </SsBtn>
          <SsBtn
            v-if="folder.index !== undefined"
            free-width
            color="negative"
            :label="$t('systemsetting.folder.unregist')"
            @click="removeFolder(folder.index)"
          />
        </div>
      </q-card>
      <AddContentsCard
        :label="$t('systemsetting.folder.localSave.add')"
        min-height="4rem"
        :card-style="{ 'min-width': '100%', 'border-radius': '5px' }"
        @click="addFolder"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.card {
  border-radius: 5px;
}
</style>
