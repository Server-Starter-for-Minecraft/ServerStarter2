<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { ImageURI } from 'app/src-electron/schema/brands';
import { ImgDialogProp } from '../iNgrok';
import ImgDialog from './ImgDialog.vue';

interface Prop {
  title: string;
  img: ImageURI;
  imgWidth: number;
}
const prop = defineProps<Prop>();

const $q = useQuasar();
const zoomBtnHovered = ref(false);

function onImgClick() {
  $q.dialog({
    component: ImgDialog,
    componentProps: {
      img: prop.img,
      imgWidth: prop.imgWidth * 2.5,
    } as ImgDialogProp,
  });
}
</script>

<template>
  <q-card-section horizontal class="full-height">
    <q-card-section>
      <div class="text-h5 q-mt-sm q-mb-lg">
        <u>{{ title }}</u>
      </div>
      <div class="text-caption">
        <slot />
      </div>
    </q-card-section>

    <q-space />

    <q-avatar
      class="col-5"
      :style="{ width: `${imgWidth}rem` }"
      style="margin: auto 0"
      @mouseover="zoomBtnHovered = true"
      @mouseleave="zoomBtnHovered = false"
    >
      <q-img :src="img" />
      <q-btn
        v-show="zoomBtnHovered"
        dense
        flat
        icon="zoom_in"
        color="grey-7"
        size="3rem"
        @click="onImgClick"
        class="absolute-center fit"
      />
    </q-avatar>
  </q-card-section>
</template>
