<script setup lang="ts">
import { Ref, ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { assets } from 'src/assets/assets';
import { checkError } from 'src/components/Error/Error';
import { useMainStore } from 'src/stores/MainStore';
import { tError } from 'src/i18n/utils/tFunc';
import { IconImage, IconSelectProp, IconSelectReturn } from './iIconSelect';
import IconBtn from './IconBtn.vue';
import ClipImg from './ClipImg.vue';
import SelectorBtn from './SelectorBtn.vue';

const prop = defineProps<IconSelectProp>()
defineEmits({...useDialogPluginComponent.emitsObject})
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()

const iconImg: Ref<IconImage> = ref({ data: prop.img, width: 64, height: 64 })
const isImgClipper = ref(false)
const customImgReload = ref(false)
const mainStore = useMainStore()

const imgs = [
  'unset',
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

async function onUpload() {
  // 画像の取得を開始
  customImgReload.value = false
  const failableImg = await window.API.invokePickDialog({ type: 'image' })
  
  // 取得画像を適用
  const returnImg = checkError(
    failableImg,
    img => iconImg.value.data = img.data,
    e => tError(e, { ignoreErrors: ['data.path.dialogCanceled'] })
  )

  // 取得画像が不適な場合にデフォルト値を当てる（or 元の画像を反映）
  if (returnImg === void 0) {
    iconImg.value.data = mainStore.world.avater_path ?? assets.png.unset
  }

  // 画像の取得状態を解除
  customImgReload.value = true
}

/**
 * 任意画像を適用する画面に切り替え
 */
function showImgClipper() {
  isImgClipper.value = true
  iconImg.value.data = mainStore.world.avater_path ?? assets.png.unset
  customImgReload.value = true
}

/**
 * 指定された画像が十分なサイズを有しているか
 */
function isErrorSize() {
  return (iconImg.value.height ?? 0) < 64 || (iconImg.value.width ?? 0) < 64
}
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card>
      <h1 class="q-pa-none q-ml-md q-pt-sm">
        {{ $t("icon.setIcon") }}
      </h1>

      <q-card-section v-if="!isImgClipper">
        <div class="q-gutter-md justify-center flex" style="margin-left: -24px;">
          <SelectorBtn
            icon="add"
            :label="$t('icon.selcIcon')"
            @click="showImgClipper"
          />
          <template v-for="imgName in imgs" :key="imgName">
            <IconBtn :logo="assets.png[imgName]" @close-event="onDialogOK" />
          </template>
        </div>
      </q-card-section>
      
      <q-card-section v-else>
        <q-item>
          <q-item-section style="image-rendering: pixelated;">
            <ClipImg v-if="customImgReload" v-model="iconImg" />
            <div v-else class="customImgSelecting">
              {{ $t('icon.selecting') }}
            </div>
          </q-item-section>
          <q-item-section side>
            <SelectorBtn
              icon="add"
              :label="$t('icon.selcIcon')"
              @click="onUpload"
            />
            <div class="q-py-md">
              <p class="text-center full-width q-ma-none" style="font-size: .6rem;">
                {{ $t("icon.prev") }}
              </p>
              <q-avatar square size="4rem">
                <q-img :src="iconImg.data" style="image-rendering: pixelated;"/>
              </q-avatar>
              <p class="text-right full-width q-ma-none" style="font-size: .5rem;">
                {{ $t('icon.size') }}
              </p>
            </div>
            <q-space />
            <SelectorBtn
              icon="check"
              :label="$t('icon.reg')"
              :disable="isErrorSize()"
              color="primary"
              @click="() => onDialogOK({ img: iconImg.data } as IconSelectReturn)"
            />
          </q-item-section>
        </q-item>
        <div v-if="isErrorSize()" class="q-pr-md text-red text-right">
          {{ $t('icon.sizeWarning') }}
        </div>
      </q-card-section>

      <div class="absolute-top-right">
        <q-btn dense flat round icon="close" size="1rem" class="q-ma-sm" @click="onDialogCancel" />
      </div>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
.customImgSelecting {
  min-width: 300px;
  height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1rem;
  opacity: .6;
}
</style>