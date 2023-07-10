<script setup lang="ts">
import { ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { assets } from 'src/assets/assets';
import { useMainStore } from 'src/stores/MainStore';
import ClipImg from './IconSelecter/ClipImg.vue';
import IconBtn from './IconSelecter/IconBtn.vue';

defineEmits({...useDialogPluginComponent.emitsObject})
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()

const tab = ref('defaultIcon')
const mainStore = useMainStore()
mainStore.iconCandidate = mainStore.world.avater_path ?? assets.svg.defaultWorldIcon
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card>
      <h1 class="q-pa-none q-ml-md" style="font-size: 1.2rem;">サーバーアイコンの設定</h1>
      <q-separator />
      <q-item class="q-pl-none">
        <q-item-section>
          <q-tabs
            v-model="tab"
            dense
            class="text-grey"
            active-color="primary"
            indicator-color="primary"
            align="justify"
            narrow-indicator
          >
            <q-tab name="defaultIcon" label="基本アイコン" />
            <q-tab name="customImg" label="画像から選択" />
          </q-tabs>

          <q-separator />

          <q-tab-panels v-model="tab" animated>
            <q-tab-panel name="defaultIcon">
              <div class="row fit q-gutter-md">
                <template v-for="n in 15" :key="n">
                  <IconBtn :logo="assets.svg.systemLogo" />
                </template>
              </div>
            </q-tab-panel>

            <q-tab-panel name="customImg">
              <ClipImg />
            </q-tab-panel>
          </q-tab-panels>
        </q-item-section>

        <q-item-section side>
          <p class="text-caption full-width q-ma-none">プレビュー</p>
          <q-avatar square size="5rem">
            <q-img :src="mainStore.iconCandidate" />
          </q-avatar>
        </q-item-section>
      </q-item>

      <q-card-actions>
        <q-btn color="primary" label="登録" @click="onDialogOK" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>