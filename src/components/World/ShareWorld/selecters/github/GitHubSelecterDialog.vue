<script setup lang="ts">
import { Ref, onMounted, ref, toRaw } from 'vue';
import { useDialogPluginComponent, useQuasar } from 'quasar';
import { RemoteWorld } from 'app/src-electron/schema/remote';
import { useMainStore } from 'src/stores/MainStore';
import { checkError } from 'src/components/Error/Error';
import { GitHubSelecterProp, GithubCheckDialogProp } from '../iRemoteSelecter';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import BaseDialogCard from 'src/components/util/baseDialog/baseDialogCard.vue';
import WorldItem from 'src/components/util/WorldItem.vue';
import ExistedGitHubDialog from './ExistedGitHubDialog.vue';
import NewGitHubDialog from './NewGitHubDialog.vue';

defineEmits({...useDialogPluginComponent.emitsObject})
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const prop = defineProps<GitHubSelecterProp>()

const $q = useQuasar()
const mainStore = useMainStore()
const loading = ref(true)
const remoteWorlds: Ref<RemoteWorld[]> = ref([])

/**
 * 既存のShareWorldを登録する
 */
function checkSetExistedRemote(selectedRemote: RemoteWorld) {
  $q.dialog({
    component: ExistedGitHubDialog,
    componentProps: {
      remoteData: prop.remoteData,
      rWorldName: selectedRemote.remote.name
    } as GithubCheckDialogProp
  }).onOk(() => {
    mainStore.world.version = selectedRemote.version
    onDialogOK()
  })
}
/**
 * 新規ShareWorldを登録する
 */
function checkSetNewRemote() {
  $q.dialog({
    component: NewGitHubDialog,
    componentProps: {
      remoteData: prop.remoteData,
      rWorldName: mainStore.world.name
    } as GithubCheckDialogProp
  }).onOk(onDialogOK)
}

onMounted(async () => {
  // 既存のShareWorldを取得
  const res = await window.API.invokeGetRemoteWorlds(toRaw(prop.remoteData))
  checkError(
    res.value,
    remotes => remoteWorlds.value = remotes,
    () => { return { title: 'ShareWorldの取得に失敗しました' } }
  )

  // 読み込み中のステータスを解除
  loading.value = false
})
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <BaseDialogCard
      :title="`${remoteData.owner}/${remoteData.repo}と同期`"
      @close="onDialogCancel"
    >
      <q-card-section>
        <span class="text-caption">ShareWorldを新規登録</span>
        <q-card-actions>
          <SsBtn
            free-width
            color="primary"
            icon="add"
            label="新規ShareWorldを作成して同期"
            @click="checkSetNewRemote"
            class="btn col"
          />
        </q-card-actions>
      </q-card-section>

      <q-card-section>
        <span class="text-caption">既存のShareWorldと同期</span>
        <div v-if="remoteWorlds.length === 0" class="messageField">
          <div v-if="loading" class="absolute-center messageText row items-center">
            <q-circular-progress
              indeterminate
              rounded
              color="grey"
              size="2rem"
              class="q-my-sm q-mr-lg"
            />
            <p class="q-ma-none">ShareWorldを読み込み中</p>
          </div>
          <div 
            v-else 
            class="absolute-center messageText"
          >
            既存のShareWorldは見つかりませんでした
          </div>
        </div>
        <div class="row q-gutter-sm justify-center">
          <template v-for="remoteWorld in remoteWorlds" :key="remoteWorld.remote.name">
            <WorldItem
              :icon="remoteWorld.avater_path"
              :world-name="remoteWorld.remote.name"
              :version-name="remoteWorld.version.id"
              @click="checkSetExistedRemote(remoteWorld)"
              style="min-width: 20rem; max-width: 20rem;;"
            />
          </template>
        </div>
      </q-card-section>
    </BaseDialogCard>
  </q-dialog>
</template>

<style scoped lang="scss">
.btn {
  font-size: 1rem;
  min-width: 12rem;
}

.messageField {
  width: 20rem;
  height: 10rem;
}

.messageText {
  width: max-content;
  font-size: 1rem;
  opacity: .6;
}
</style>