<script setup lang="ts">
import { ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { assets } from 'src/assets/assets';
import { useMainStore } from 'src/stores/MainStore';
import { checkError } from 'src/components/Error/Error';
import IconBtn from './IconSelecter/IconBtn.vue';
import ClipImg from './IconSelecter/ClipImg.vue';

defineEmits({...useDialogPluginComponent.emitsObject})
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()

const tab = ref('defaultIcon')
const mainStore = useMainStore()
mainStore.iconCandidate = mainStore.world.avater_path ?? assets.svg.defaultWorldIcon

const imgs = [
  'bamboo_block',
  'bedrock',
  'bookshelf',
  'brain_coral_block',
  'bricks',
  'cherry_leaves',
  'cherry_planks',
  'chiseled_sandstone',
  'cobblestone',
  'command_block_back',
  'crafting_table_front',
  'diamond_block',
  'dirt',
  'emerald_block',
  'end_stone',
  'flowering_azalea_leaves',
  'furnace_front_on',
  'glowstone',
  'grass_block_side',
  'netherrack',
  'oak_log_top',
  'oak_planks',
  'obsidian',
  'prismarine',
  'redstone_block',
  'redstone_lamp_on',
  'stone_bricks',
  'tnt_side',
  'tube_coral_block'
] as const

const uploaded = ref(false)
async function onUpload() {
  uploaded.value = false
  const failableImg = await window.API.invokePickDialog({ type: 'image' })
  
  checkError(
    failableImg,
    async (img) => {
      mainStore.iconCandidate = img.data
      uploaded.value = true
    },
    '画像の取得に失敗しました'
  )
}

function onTabChanged() {
  if (tab.value === 'customImg') {
    onUpload()
  }
}
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card>
      <h1 class="q-pa-none q-ml-md" style="font-size: 1.2rem;">サーバーアイコンの設定</h1>
      <q-card-section>
        <div class="q-gutter-md">
          <q-btn dense outline icon="add" size="1.33rem" />
          <template v-for="imgName in imgs" :key="imgName">
            <IconBtn :logo="assets.png[imgName]" @close-event="onDialogOK" />
          </template>
        </div>
      </q-card-section>
      <!-- <q-tabs
        v-model="tab"
        @update:model-value="onTabChanged"
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
      <q-item class="q-pl-none">
        <q-item-section>
          <q-tab-panels v-model="tab" animated>
            <q-tab-panel name="defaultIcon">
              <div class="row fit q-gutter-md">
                <template v-for="n in 15" :key="n">
                  <IconBtn :logo="assets.svg.systemLogo" />
                </template>
              </div>
            </q-tab-panel>

            <q-tab-panel name="customImg" class="q-pr-none">
              <q-btn color="blue" label="画像を選択" @click="onUpload" />
              <ClipImg v-if="uploaded" :is="uploaded" />
            </q-tab-panel>
          </q-tab-panels>
        </q-item-section>

        <q-item-section side>
          <q-space />
          <div class="q-py-md">
            <p class="text-caption full-width q-ma-none">プレビュー</p>
            <q-avatar square size="5rem">
              <q-img :src="mainStore.iconCandidate" />
            </q-avatar>
          </div>
          <q-space />
          <q-btn color="primary" label="登録" @click="onDialogOK" />
        </q-item-section>
      </q-item> -->
    </q-card>
  </q-dialog>
</template>