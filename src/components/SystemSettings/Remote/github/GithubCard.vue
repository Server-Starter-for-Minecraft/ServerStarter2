<script setup lang="ts">
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { GithubRemoteSetting } from 'app/src-electron/schema/remote';
import { getRemotesKey, useSystemStore } from 'src/stores/SystemStore';
import { updatePatProp, unlinkRepoProp, updatePatDialogReturns } from './iGitHubDialog';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import UpdatePatDialog from './UpdatePatDialog.vue';
import UnlinkRepoDialog from './UnlinkRepoDialog.vue';

interface Prop {
  remote: GithubRemoteSetting
  onRegisterClick?: () => void
}
const prop = defineProps<Prop>()

const $q = useQuasar()
const sysStore = useSystemStore()
const { t } = useI18n()

function openPatEditor() {
  $q.dialog({
    component: UpdatePatDialog,
    componentProps: {
      oldPat: prop.remote.pat
    } as updatePatProp
  }).onOk((payload: updatePatDialogReturns) => {
    sysStore.remoteSettings[getRemotesKey(prop.remote.folder)].pat = payload.newPat
  })
}

function checkUnlinkRepo() {
  $q.dialog({
    component: UnlinkRepoDialog,
    componentProps: {
      title: t('shareWorld.githubCard.unresister.dialog', { name: getRemotesKey(prop.remote.folder) }),
      owner: prop.remote.folder.owner,
      repo: prop.remote.folder.repo
    } as unlinkRepoProp
  }).onOk(() => {
    delete sysStore.baseRemotes[getRemotesKey(prop.remote.folder)]
    sysStore.remoteSettings
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
    </q-card-section>

    <q-card-actions vertical>
      <SsBtn :label="$t('shareWorld.githubCard.updatePAT')" @click="openPatEditor" class="q-mb-sm" />
      <SsBtn v-if="onRegisterClick === void 0" :label="$t('shareWorld.githubCard.unresister.remote')" color="red"
        @click="checkUnlinkRepo" />
      <SsBtn v-else :label="$t('shareWorld.githubCard.useRemote')" color="primary" @click="onRegisterClick" />
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
}
</style>