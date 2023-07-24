<script setup lang="ts">
import { useQuasar } from 'quasar';
import { GithubAccountSetting } from 'app/src-electron/schema/remote';
import { useSystemStore } from 'src/stores/SystemStore';
import { updatePatProp, unlinkRepoProp, updatePatDialogReturns } from './iGitHubDialog';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import UpdatePatDialog from './UpdatePatDialog.vue';
import UnlinkRepoDialog from './UnlinkRepoDialog.vue';

interface Prop {
  remote: GithubAccountSetting
  onRegisterClick?: () => void
}
const prop = defineProps<Prop>()

const $q = useQuasar()
const sysStore = useSystemStore()
const sysKey = `${prop.remote.owner}/${prop.remote.repo}`

function openPatEditor() {
  $q.dialog({
    component: UpdatePatDialog,
    componentProps: {
      oldPat: prop.remote.pat
    } as updatePatProp
  }).onOk((payload: updatePatDialogReturns) => {
    sysStore.remoteSettings().github[sysKey].pat = payload.newPat
  })
}

function checkUnlinkRepo() {
  $q.dialog({
    component: UnlinkRepoDialog,
    componentProps: {
      title: `${sysKey} を解除`,
      owner: prop.remote.owner,
      repo: prop.remote.repo
    } as unlinkRepoProp
  }).onOk(() => {
    delete sysStore.remoteSettings().github[sysKey]
  })
}
</script>

<template>
  <q-card flat class="q-py-sm q-px-md">
    <q-card-section class="q-pt-xs">
      <div class="caption q-pb-sm">GitHub</div>
      <div class="q-py-sm">
        <div class="caption">ユーザー</div>
        <div class="dataText">{{ remote.owner }}</div>
      </div>
      <div class="q-py-sm">
        <div class="caption">リポジトリ</div>
        <div class="dataText">{{ remote.repo }}</div>
      </div>
    </q-card-section>

    <q-card-actions vertical>
      <SsBtn
        label="Personal Access Token を更新"
        @click="openPatEditor"
        class="q-mb-sm"
      />
      <SsBtn
        v-if="onRegisterClick === void 0"
        label="リモートの登録を解除"
        color="red"
        @click="checkUnlinkRepo"
      />
      <SsBtn
        v-else
        label="このリモートを利用する"
        color="primary"
        @click="onRegisterClick"
      />
    </q-card-actions>
  </q-card>
</template>

<style scoped lang="scss">
.caption {
  font-size: .6rem;
  opacity: .6;
}

.dataText {
  font-size: 1.5rem;
  line-height: 1.5rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>