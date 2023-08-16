<script setup lang="ts">
import { getCssVar, useQuasar } from 'quasar';
import { WorldContainerSetting } from 'app/src-electron/schema/system';
import { dangerDialogProp } from 'src/components/util/danger/iDangerDialog';
import { useSystemStore } from 'src/stores/SystemStore';
import { AddFolderDialogProps, AddFolderDialogReturns } from './iAddFolder';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import AddFolderDialog from 'src/components/SystemSettings/Folder/AddFolderDialog.vue';
import DangerDialog from 'src/components/util/danger/DangerDialog.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n()

interface Prop {
  loading?: boolean
  disable?: boolean
  showOperationBtns?: boolean
  active?: boolean
  onClick?: () => void
}
defineProps<Prop>()
const folder = defineModel<WorldContainerSetting>({ required: true })

const $q = useQuasar()
const sysStore = useSystemStore()

function switchVisible() {
  return folder.value.visible = !folder.value.visible
}

function editFolder() {
  $q.dialog({
    component: AddFolderDialog,
    componentProps: {
      containerSettings: folder.value
    } as AddFolderDialogProps
  }).onOk((payload: AddFolderDialogReturns) => {
    folder.value.name = payload.name
    folder.value.container = payload.container
  })
}

function removeFolder() {
  $q.dialog({
    component: DangerDialog,
    componentProps: {
      dialogTitle: t('systemsetting.folder.unregistTitle',{ name: folder.value.name }),
      dialogDesc: t('systemsetting.folder.unregistDialog',{ name: folder.value.name }),
      okBtnTxt: t('systemsetting.folder.unregist')
    } as dangerDialogProp
  }).onOk(() => {
    sysStore.systemSettings.container.splice(
      sysStore.systemSettings.container.map(c => c.name).indexOf(folder.value.name), 1
    )
  })
}
</script>

<template>
  <q-card
    flat
    bordered 
    :style="{ 'border-color': active ? getCssVar('primary') : 'transparent' }"
  >
    <q-item
      :clickable="onClick !== void 0"
      :active="active"
      :disable="loading || disable"
      @click="onClick"
    >
      <q-item-section>
        <div class="text-omit" style="font-size: 1.1rem;">{{ folder.name }}</div>
        <div class="text-caption text-omit" style="opacity: .6;">{{ folder.container }}</div>
      </q-item-section>
  
      <q-item-section side>
        <div class="row q-gutter-sm">
          <ss-btn
            dense
            free-width
            :icon="folder.visible ? 'visibility' : 'visibility_off'"
            :disable="sysStore.systemSettings.container.filter(c => c.visible).length === 1 && folder.visible || disable"
            @click="switchVisible"
          >
            <q-tooltip>
              {{ folder.visible ? $t('systemsetting.folder.tooltipVisible') : $t('systemsetting.folder.tooltipInvisible') }}
            </q-tooltip>
          </ss-btn>
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
            color="red"
            :disable="sysStore.systemSettings.container.length === 1 || disable"
            @click="removeFolder"
          />
        </div>
      </q-item-section>

      <div class="absolute-center">
        <q-circular-progress
          v-show="loading"
          indeterminate
          rounded
          size="40px"
          color="primary"
          class="q-ma-md"
        />
      </div>
    </q-item>
  </q-card>
</template>