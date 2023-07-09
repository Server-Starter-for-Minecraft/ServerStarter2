<script setup lang="ts">
import { ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { iIconSelectReturns } from './IconSelect';
import { assets } from 'src/assets/assets';
import Cropper from 'cropperjs';
import "cropperjs/dist/cropper.css";
import ClipImg from './ClipImg.vue';


defineEmits({...useDialogPluginComponent.emitsObject})
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()

const tab = ref('defaultIcon')
const cropper = ref()
const resultImg = ref()

function onOKClicked() {
  onDialogOK({

  } as iIconSelectReturns)
}

function getImg() {
  console.log(cropper.value)
  console.log(cropper.value.getCropBoxData())
}
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
                  <q-avatar square size="2rem" class="q-pb-sm" >
                    <q-img :src="assets.svg.systemLogo" :ratio="1" />
                    <q-btn
                      dense
                      flat
                      outline
                      size="1rem"
                      icon=""
                      class="absolute-center"
                    />
                  </q-avatar>
                </template>
              </div>
            </q-tab-panel>

            <q-tab-panel name="customImg">
              <!-- TOOD: 画像切り出しの実装 -->
              <ClipImg />
            </q-tab-panel>
          </q-tab-panels>
        </q-item-section>

        <q-item-section side>
          <p class="text-caption full-width q-ma-none">プレビュー</p>
          <q-avatar square size="5rem">
            <q-img src="https://cdn.quasar.dev/img/linux-avatar.png" />
          </q-avatar>
        </q-item-section>
      </q-item>
    </q-card>
  </q-dialog>
</template>