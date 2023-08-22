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
import { tError } from 'src/i18n/utils/tFunc';

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
      rWorldName: selectedRemote.remote.name,
      rIcon: selectedRemote.avater_path,
      rVersionName: selectedRemote.version.id
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
      rWorldName: mainStore.world.name,
      rIcon: mainStore.world.avater_path,
      rVersionName: mainStore.world.version.id
    } as GithubCheckDialogProp
  }).onOk(onDialogOK)
}

onMounted(async () => {
  // 既存のShareWorldを取得
  const res = await window.API.invokeGetRemoteWorlds(toRaw(prop.remoteData))
  checkError(
    res.value,
    remotes => remoteWorlds.value = remotes,
    e => tError(
      e,
      {
        titleKey: 'failGetShareWorld',
        descKey: `error.${e.key}.title`
      }
    )
    //() => { return { title: 'ShareWorldの取得に失敗しました' } }
  )

  // 読み込み中のステータスを解除
  loading.value = false
})
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <BaseDialogCard
      :title="$t('shareWorld.sync',{path: `${remoteData.owner}/${remoteData.repo}`})"
      @close="onDialogCancel"
    >
      <q-card-section>
        <span class="text-caption">{{ $t('shareWorld.selectRemote.title') }}</span>
        <q-card-actions>
          <SsBtn
            free-width
            color="primary"
            icon="add"
            :label="$t('shareWorld.selectRemote.makeShareWorld')"
            @click="checkSetNewRemote"
            class="btn col"
          />
        </q-card-actions>
      </q-card-section>

      <q-card-section>
        <span class="text-caption">{{ $t('shareWorld.selectRemote.syncExistWorld') }}</span>
        <div v-if="remoteWorlds.length === 0" class="messageField">
          <div v-if="loading" class="absolute-center messageText row items-center">
            <q-circular-progress
              indeterminate
              rounded
              color="grey"
              size="2rem"
              class="q-my-sm q-mr-lg"
            />
            <p class="q-ma-none">{{ $t('shareWorld.selectRemote.loading') }}</p>
          </div>
          <div 
            v-else 
            class="absolute-center messageText"
          >
            {{ $t('shareWorld.selectRemote.notFound') }}
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