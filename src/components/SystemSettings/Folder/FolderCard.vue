<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { getCssVar, useQuasar } from 'quasar';
import { WorldContainerSetting } from 'app/src-electron/schema/system';
import { dangerDialogProp } from 'src/components/util/danger/iDangerDialog';
import { useSystemStore } from 'src/stores/SystemStore';
import { AddFolderDialogProps, AddFolderDialogReturns } from './iAddFolder';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import AddFolderDialog from 'src/components/SystemSettings/Folder/AddFolderDialog.vue';
import DangerDialog from 'src/components/util/danger/DangerDialog.vue';

const { t } = useI18n()

interface Prop {
  loading?: boolean
  disable?: boolean
  showOperationBtns?: boolean
  active?: boolean
  onClick?: () => void
  onVisibleClick?: () => void
}
const prop = defineProps<Prop>()
const folder = defineModel<WorldContainerSetting>({ required: true })

const $q = useQuasar()
const sysStore = useSystemStore()

function switchVisible() {
  folder.value.visible = !folder.value.visible
  if (prop.onVisibleClick !== void 0) prop.onVisibleClick()
}

function getCardSytleClass(active?: boolean, disable?: boolean) {
  const returnClasses = []
  if (active) returnClasses.push('text-primary')
  if (disable) returnClasses.push('disable')
  return returnClasses.join(' ')
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
    class="card fit"
    :style="{ 'border-color': active ? getCssVar('primary') : 'transparent' }"
  >
    <div class="row">
      <div
        class="col q-pl-md q-py-md"
        :class="getCardSytleClass(active, disable || loading)"
        style="margin: auto 0;"
      >
        <div class="text-omit" style="font-size: 1.1rem;">{{ folder.name }}</div>
        <div class="text-caption text-omit" style="opacity: .6;">{{ folder.container }}</div>
      </div>

      <!-- cardをクリックできるようにする -->
      <div v-if="onClick !== void 0 || !disable" class="absolute-top fit">
        <q-btn flat color="transparent" @click="onClick" class="fit"/>
      </div>

      <div class="row q-gutter-x-sm q-pr-md" style="margin: auto 0;">
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
    </div>

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
  </q-card>
</template>

<style scoped lang="scss">
.card {
  border-radius: 5px;
}

.disable {
  opacity: .6;
  outline: 0;
  cursor: not-allowed;
}
</style>