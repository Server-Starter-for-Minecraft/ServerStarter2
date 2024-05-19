<script setup lang="ts">
import { ref, toRaw } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDialogPluginComponent } from 'quasar';
import { RemoteWorldName } from 'app/src-electron/schema/brands';
import { isError, isValid } from 'src/scripts/error';
import SsI18nT from 'src/components/util/base/SsI18nT.vue';
import SsInput from 'src/components/util/base/ssInput.vue';
import BaseDialogCard from 'src/components/util/baseDialog/baseDialogCard.vue';
import { GithubCheckDialogProp, setRemoteWorld } from '../iRemoteSelecter';

defineEmits({ ...useDialogPluginComponent.emitsObject });
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const prop = defineProps<GithubCheckDialogProp>();

const loading = ref(false);
const isValidName = ref(false);
const inputName = ref(prop.rWorldName);
const { t } = useI18n();

/**
 * ワールド名のバリデーションを行う
 */
async function validateWorldName(name: string) {
  const res = await window.API.invokeValidateNewRemoteWorldName(
    toRaw(prop.remoteData),
    name
  );
  if (isError(res)) {
    isValidName.value = false;
    return t('shareWorld.newRemote.unavailName');
  } else {
    isValidName.value = true;
    return true;
  }
}

/**
 * リモートを登録
 */
async function setRemote() {
  loading.value = true;
  const res = await setRemoteWorld(
    {
      name: inputName.value as RemoteWorldName,
      folder: {
        type: 'github',
        owner: prop.remoteData.owner,
        repo: prop.remoteData.repo,
      },
    },
    false
  );

  if (isValid(res)) {
    onDialogOK();
  }
}
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" :persistent="loading">
    <BaseDialogCard
      :title="$t('shareWorld.newRemote.title')"
      :ok-btn-txt="$t('shareWorld.newRemote.btn')"
      :loading="loading"
      :disable="!isValidName"
      :onClose="loading ? undefined : onDialogCancel"
      @ok-click="setRemote"
    >
      <p style="font-size: 0.8rem; opacity: 0.8">
        <SsI18nT keypath="shareWorld.newRemote.desc" tag="false">
          <br />
          <br />
          <span class="text-negative text-bold">{{
            $t('shareWorld.newRemote.caution')
          }}</span>
        </SsI18nT>
      </p>

      <SsInput
        v-model="inputName"
        :label="$t('shareWorld.newRemote.inputName')"
        :debounce="200"
        :rules="[(val) => validateWorldName(val)]"
        @clear="isValidName = false"
      />
    </BaseDialogCard>
  </q-dialog>
</template>
