<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { WorldContainerSetting } from 'app/src-electron/schema/system';
import { useSystemStore } from 'src/stores/SystemStore';
import { dangerDialogProp } from 'src/components/util/danger/iDangerDialog';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import DangerDialog from 'src/components/util/danger/DangerDialog.vue';
import AddFolderDialog from 'src/components/SystemSettings/Folder/AddFolderDialog.vue';
import FolderCardBase from './FolderCardBase.vue';
import { AddFolderDialogProps, AddFolderDialogReturns } from './iAddFolder';

const { t } = useI18n();

interface Prop {
  loading?: boolean;
  disable?: boolean;
  showOperationBtns?: boolean;
  active?: boolean;
  onClick?: () => void;
  onVisibleClick?: () => void;
}
defineProps<Prop>();
const folder = defineModel<WorldContainerSetting>({ required: true });

const $q = useQuasar();
const sysStore = useSystemStore();

function editFolder() {
  $q.dialog({
    component: AddFolderDialog,
    componentProps: {
      containerSettings: folder.value,
    } as AddFolderDialogProps,
  }).onOk((payload: AddFolderDialogReturns) => {
    folder.value.name = payload.name;
    folder.value.container = payload.container;
  });
}

function removeFolder() {
  $q.dialog({
    component: DangerDialog,
    componentProps: {
      dialogTitle: t('systemsetting.folder.unregistTitle', {
        name: folder.value.name,
      }),
      dialogDesc: t('systemsetting.folder.unregistDialog', {
        name: folder.value.name,
      }),
      okBtnTxt: t('systemsetting.folder.unregist'),
    } as dangerDialogProp,
  }).onOk(() => {
    sysStore.systemSettings.container.splice(
      sysStore.systemSettings.container
        .map((c) => c.name)
        .indexOf(folder.value.name),
      1
    );
  });
}
</script>

<template>
  <FolderCardBase
    v-model:visible="folder.visible"
    :title="folder.name"
    :path="folder.container"
    :tooltip-visible="$t('systemsetting.folder.tooltipVisible')"
    :tooltip-invisible="$t('systemsetting.folder.tooltipInvisible')"
    :loading="loading"
    :disable="disable"
    :active="active"
    :disable-open="folder.name === 'default'"
    :disable-visible="
      (sysStore.systemSettings.container.filter((c) => c.visible).length ===
        1 &&
        folder.visible) ||
      active ||
      sysStore.systemSettings.container
        .map((c) => c.name)
        .indexOf(folder.name) === 0 ||
      disable
    "
    :on-click="onClick"
    @update:visible="onVisibleClick?.()"
  >
    <template #actions>
      <ss-btn
        v-show="showOperationBtns && folder.name !== 'default'"
        free-width
        :label="$t('general.edit')"
        :disable="disable"
        @click="editFolder"
      />
      <ss-btn
        v-show="showOperationBtns"
        free-width
        :label="$t('systemsetting.folder.unregist')"
        color="negative"
        :disable="sysStore.systemSettings.container.length === 1 || disable"
        @click="removeFolder"
      />
    </template>
  </FolderCardBase>
</template>
