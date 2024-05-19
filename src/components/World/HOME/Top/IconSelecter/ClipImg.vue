<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { debounce } from 'quasar';
import imageCompression from 'browser-image-compression';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';
import { ImageURI } from 'app/src-electron/schema/brands';
import { IconImage } from './iIconSelect';

const iconImg = defineModel<IconImage>({ required: true });

const cropImg = ref();
let cropper: Cropper | undefined = undefined;

function updateImg() {
  // Cropper.jsの出力をcanvas要素形式で受け取る
  var canvas = cropper?.getCroppedCanvas();

  // 画像のサイズをセット
  iconImg.value.width = canvas?.width;
  iconImg.value.height = canvas?.height;

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
        iconImg.value.data = reader.result as ImageURI;
      };
    });
  });
}

onMounted(() => {
  cropper = new Cropper(cropImg.value, {
    aspectRatio: 1,
    background: false,
    viewMode: 1,
    dragMode: 'move',
    autoCropArea: 1,
    guides: false,
    cropBoxMovable: false,
    cropBoxResizable: false,
    toggleDragModeOnDblclick: false,
    ready: updateImg,
    crop: debounce(updateImg, 100),
  });
});
</script>

<template>
  <q-card flat>
    <img ref="cropImg" alt="Vue logo" :src="iconImg.data" />
  </q-card>
</template>

<style scoped lang="scss">
img {
  display: block;

  min-width: 300px;
  min-height: 300px;
  aspect-ratio: 1;

  /* This rule is very important, please don't ignore this */
  max-width: 100%;
}
</style>
