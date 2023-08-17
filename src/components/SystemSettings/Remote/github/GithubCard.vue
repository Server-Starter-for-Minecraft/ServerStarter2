<script setup lang="ts">
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { GithubRemoteSetting, RemoteFolder } from 'app/src-electron/schema/remote';
import { useSystemStore } from 'src/stores/SystemStore';
import { updatePatProp, updatePatDialogReturns } from './iGitHubDialog';
import { dangerDialogProp } from 'src/components/util/danger/iDangerDialog';
import { deleteFromValue } from 'src/scripts/obj';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import UpdatePatDialog from './UpdatePatDialog.vue';
import DangerDialog from 'src/components/util/danger/DangerDialog.vue';

interface Prop {
  disable?: boolean
  showUnlink?: boolean
  onRegisterClick?: (remoteData: RemoteFolder) => void
  worldName?: string
}
const prop = defineProps<Prop>()
const remote = defineModel<GithubRemoteSetting>({ required: true })

const $q = useQuasar()
const sysStore = useSystemStore()
const { t } = useI18n()

function openPatEditor() {
  $q.dialog({
    component: UpdatePatDialog,
    componentProps: {
      oldPat: remote.value.pat
    } as updatePatProp
  }).onOk((payload: updatePatDialogReturns) => {
    remote.value.pat = payload.newPat
  })
}

function checkUnlinkRepo() {
  $q.dialog({
    component: DangerDialog,
    componentProps: {
      dialogOverline: t('shareWorld.github'),
      dialogTitle: t(
        'shareWorld.githubCard.unregister.dialog',
        { name: remote.value.folder.repo }
      ),
      dialogDesc: t(
        'shareWorld.githubCard.unregister.desc',
        { owner: remote.value.folder.owner, repo: remote.value.folder.repo }
      ),
      okBtnTxt: t('shareWorld.githubCard.unregister.decide')
    } as dangerDialogProp
  }).onOk(() => {
    deleteFromValue(sysStore.systemSettings.remote, remote.value)
  })
}
</script>

<template>
  <q-card flat class="q-py-sm q-px-md">
    <q-card-section class="q-pt-xs">
      <div class="caption q-pb-sm">GitHub</div>
      <div class="q-py-sm">
        <div class="caption">{{ $t('shareWorld.githubCard.account') }}</div>
        <div class="dataText text-omit">{{ remote.folder.owner }}</div>
      </div>
      <div class="q-py-sm">
        <div class="caption">{{ $t('shareWorld.githubCard.repository') }}</div>
        <div class="dataText text-omit">{{ remote.folder.repo }}</div>
      </div>
      <div v-if="worldName" class="q-py-sm">
        <div class="caption">{{ $t('shareWorld.githubCard.worldName') }}</div>
        <div class="dataText text-omit">{{ worldName }}</div>
      </div>
    </q-card-section>

    <q-card-actions vertical>
      <SsBtn
        :label="$t('shareWorld.githubCard.updatePAT')"
        :disable="disable"
        @click="openPatEditor"
        class="q-mb-sm"
      />
      <SsBtn
        v-if="showUnlink"
        :disable="disable"
        :label="$t('shareWorld.githubCard.unregister.remote')"
        color="red"
        @click="checkUnlinkRepo"
      />
      <SsBtn
        v-if="onRegisterClick !== void 0"
        :disable="disable"
        :label="$t('shareWorld.githubCard.useRemote')"
        color="primary"
        @click="onRegisterClick(remote.folder)"
      />
    </q-card-actions>
  </q-card>
</template>

<style scoped lang="scss">
.caption {
  font-size: .6rem;
  opacity: .6;
  padding-bottom: 4px;
}

.dataText {
  font-size: 1.5rem;
  line-height: 1.5rem;
}
</style>