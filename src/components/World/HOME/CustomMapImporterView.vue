<script setup lang="ts">
import { Ref, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDialogPluginComponent, useQuasar } from 'quasar';
import { CustomMapData } from 'app/src-electron/schema/filedata';
import { checkError } from 'src/components/Error/Error';
import { CustomMapImporterProp } from './CustomMapImporter/iCustomMapImporter';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import CheckDialog from './CustomMapImporter/checkDialog.vue';
import WorldItem from 'src/components/util/WorldItem.vue';

defineEmits({...useDialogPluginComponent.emitsObject})
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()

const $q = useQuasar()
const { t } = useI18n()
const localWorlds:Ref<CustomMapData[]> = ref([])
const loading = ref(true)

/**
 * 配布ワールドのZip版を導入
 */
async function importZip() {
  const res = await window.API.invokePickDialog({ type: 'world', isFile: true })
  checkError(
    res,
    w => showCheckDialog(w),
    e => { return { title: t(`error.${e.key}`) }}
    //() => { return { title: '配布ワールドの導入に失敗しました' } }
  )
}
/**
 * 配布ワールドのフォルダ版を導入
 */
async function importFolder() {
  const res = await window.API.invokePickDialog({ type: 'world', isFile: false })
  checkError(
    res,
    w => showCheckDialog(w),
    e => { return { title: t(`error.${e.key}`) }}
    //() => { return { title: '配布ワールドの導入に失敗しました' } }
  )
}

/**
 * 配布ワールドで既存のデータを上書きするかの確認を行う
 */
function showCheckDialog(customMap: CustomMapData) {
  // 確認Dialogの表示
  $q.dialog({
    component: CheckDialog,
    componentProps: {
      customMap: customMap
    } as CustomMapImporterProp
  }).onOk(() => {
    onDialogOK()
  })
}

onMounted(async () => {
  const res = await window.API.invokeGetLocalSaveData()
  checkError(
    res.value,
    lws => localWorlds.value = lws,
    () => { return { title: 'シングルワールドの読み込みに失敗しました' } }
  )

  // 読み込み処理の終了を通知
  loading.value = false
})
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card>
      <h1 class="q-pa-none q-ml-md q-pt-sm">
        {{ $t('worldList.addSeveralWorld') }}
      </h1>

      <q-card-section>
        <span class="text-caption">{{ $t('worldList.addCustomWorld') }}</span>
        <q-card-actions vertical>
          <SsBtn
            free-width
            color="primary"
            icon="add"
            :label="$t('worldList.selectZip')"
            @click="importZip"
            class="btn"
          />
          <SsBtn
            free-width
            color="primary"
            icon="add"
            :label="$t('worldList.selectFolder')"
            @click="importFolder"
            class="btn"
          />
        </q-card-actions>
      </q-card-section>

      <q-card-section>
        <span class="text-caption">{{ $t('worldList.addSingleWorld') }}</span>
        <div v-if="localWorlds.length === 0" class="messageField">
          <div v-if="loading" class="absolute-center messageText row">
            <q-circular-progress
              indeterminate
              rounded
              color="grey"
              size="2rem"
              class="q-my-sm q-mr-lg"
            />
            <p>シングルプレイワールドを<br>読み込み中</p>
          </div>
          <div v-else class="absolute-center messageText">
            シングルプレイワールドは<br>見つかりませんでした
          </div>
        </div>
        <q-list v-else separator>
          <template v-for="localWorld in localWorlds" :key="localWorld.path">
            <WorldItem :world="localWorld" @click="showCheckDialog(localWorld)" />
          </template>
        </q-list>
      </q-card-section>

      <div class="absolute-top-right">
        <q-btn
          dense
          flat
          round
          icon="close"
          size="1rem"
          class="q-ma-sm"
          @click="onDialogCancel"
        />
      </div>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
.btn {
  font-size: 1rem;
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