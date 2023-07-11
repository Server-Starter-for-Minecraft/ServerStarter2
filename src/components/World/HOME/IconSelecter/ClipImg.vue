<script setup lang="ts">
import { onMounted, ref } from 'vue';
import imageCompression from 'browser-image-compression';
import "cropperjs/dist/cropper.css";
import Cropper from 'cropperjs';
import { ImageURI } from 'app/src-electron/schema/brands';
import { useMainStore } from 'src/stores/MainStore';

const mainStore = useMainStore()
const cropImg = ref()
let cropper: Cropper | undefined = undefined

function updateImg() {
  // Cropper.jsの出力をcanvas要素形式で受け取る
  var canvas = cropper?.getCroppedCanvas();

  // canvas要素をBlob形式に変換する
  canvas?.toBlob((blob) => {
    // Browser Image CompressionなどのJavaScriptモジュールを使用して圧縮する
    imageCompression(blob as File, {
      maxSizeMB: 1,
      maxWidthOrHeight: 64,
    }).then((compressedBlob) => {
      // compressedBlobをbase64形式の文字列に変換する
      var reader = new FileReader();
      reader.readAsDataURL(compressedBlob);
      reader.onloadend = () => {
        mainStore.iconCandidate = reader.result as ImageURI;
      }
    });
  });
}

onMounted(() => {
  cropper = new Cropper(cropImg.value, {
    aspectRatio: 1,
    viewMode: 3,
    dragMode: 'move',
    autoCropArea: 1,
    restore: false,
    guides: false,
    highlight: false,
    cropBoxMovable: false,
    cropBoxResizable: false,
    toggleDragModeOnDblclick: false,
    ready: () => {
      updateImg()
    },
    cropend: () => {
      updateImg()
    },
    zoom: () => {
      updateImg()
    }
  });
})
</script>

<template>
  <q-card flat>
    <q-card-section class="q-px-none">
      <img ref="cropImg" alt="Vue logo" :src="mainStore.iconCandidate">
    </q-card-section>
  </q-card>
</template>

<style scoped lang="scss">
img {
  display: block;

  /* This rule is very important, please don't ignore this */
  max-width: 100%;
}
</style>