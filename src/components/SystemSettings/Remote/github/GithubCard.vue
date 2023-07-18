<script setup lang="ts">
import { useQuasar } from 'quasar';
import { GithubAccountSetting } from 'app/src-electron/schema/remote';
import { updatePatProp, unlinkRepoProp, updatePatDialogReturns } from '../baseDialog/iBaseDialog';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import UpdatePatDialog from './UpdatePatDialog.vue';

interface Prop {
  remote: GithubAccountSetting
}
const prop = defineProps<Prop>()

const $q = useQuasar()

function openPatEditor() {
  $q.dialog({
    component: UpdatePatDialog,
    componentProps: {
      overline: 'GitHub',
      title: 'Personal Access Tokenを更新',
      okBtnTxt: 'Tokenを更新',
      oldPat: prop.remote.pat
    } as updatePatProp
  }).onOk((payload: updatePatDialogReturns) => {
    // TODO: patの更新方法を確立
    // prop.remote.pat = payload.newPat
  })
}

function checkUnlinkRepo() {
  $q.dialog({
    component: UpdatePatDialog,
    componentProps: {
      overline: 'GitHub',
      title: 'Personal Access Tokenを更新',
      okBtnTxt: 'Tokenを更新'
    } as unlinkRepoProp
  }).onOk(() => {
    // TODO: patの更新方法を確立
    // prop.remote.pat = payload.newPat
  })
}
</script>

<template>
  <q-card flat class="q-py-sm q-px-md">
    <q-card-section class="q-pt-xs">
      <div class="caption q-pb-sm">GitHub</div>
      <div class="q-py-sm">
        <div class="caption" style="opacity: .6;">ユーザー</div>
        <div class="dataText">{{ remote.owner }}</div>
      </div>
      <div class="q-py-sm">
        <div class="caption" style="opacity: .6;">リポジトリ</div>
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
        label="リモートの登録を解除"
        color="red"
        @click="checkUnlinkRepo"
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