<script setup lang="ts">
import { ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { assets } from 'src/assets/assets';
import { useMainStore } from 'src/stores/MainStore';
import { isValid } from 'src/scripts/error';
import IconBtn from './IconSelecter/IconBtn.vue';
import ClipImg from './IconSelecter/ClipImg.vue';
import SelectorBtn from './IconSelecter/SelectorBtn.vue';

defineEmits({...useDialogPluginComponent.emitsObject})
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()

const isImgClipper = ref(false)
const customImgReload = ref(false)
const mainStore = useMainStore()

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

async function onUpload() {
  customImgReload.value = false
  const failableImg = await window.API.invokePickDialog({ type: 'image' })
  
  if (isValid(failableImg)) {
    mainStore.iconCandidate = failableImg.data
  }
  else {
    mainStore.iconCandidate = mainStore.world.avater_path ?? assets.png.unset
  }

  customImgReload.value = true
}

function showImgClipper() {
  isImgClipper.value = true
  mainStore.iconCandidate = mainStore.world.avater_path ?? assets.png.unset
  customImgReload.value = true
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
            <ClipImg v-if="customImgReload" />
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
                <q-img :src="mainStore.iconCandidate" style="image-rendering: pixelated;"/>
              </q-avatar>
              <p class="text-right full-width q-ma-none" style="font-size: .5rem;">
                {{ $t('icon.size') }}
              </p>
            </div>
            <q-space />
            <SelectorBtn
              icon="check"
              :label="$t('icon.reg')"
              color="primary"
              @click="onDialogOK"
            />
          </q-item-section>
        </q-item>
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