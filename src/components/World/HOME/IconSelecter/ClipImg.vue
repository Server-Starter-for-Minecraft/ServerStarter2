<script setup lang="ts">
import { onMounted, ref } from 'vue';
import imageCompression from 'browser-image-compression';
import "cropperjs/dist/cropper.css";
import Cropper from 'cropperjs';
import { ImageURI } from 'app/src-electron/schema/brands';
import { checkError } from 'src/components/Error/Error';
import { useMainStore } from 'src/stores/MainStore';

const defaultImg = ref()
const cropImg = ref()
let cropper: Cropper | undefined = undefined
const mainStore = useMainStore()

function onClicked() {
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

// async function onUpload() {
//   const failableImg = await window.API.invokePickDialog()
//   checkError(
//     failableImg,
//     img => defaultImg.value = img,
//     '画像の取得に失敗しました'
//   )
// }

onMounted(() => {
  cropper = new Cropper(cropImg.value, {
    aspectRatio: 1,
    background: false,
    modal: false,
    highlight: false,
    viewMode: 1
  });
})
</script>

<template>
  <img ref="cropImg" width="200" height="200" alt="Vue logo" src="https://cdn.quasar.dev/img/linux-avatar.png">
  <q-btn color="orange" label="プレビュー" @click="onClicked" />
  <!-- <q-btn v-if="defaultImg === void 0" color="blue" label="画像を選択" @click="onUpload" />
  <q-card v-else flat>
    <q-card-section>
      <img ref="cropImg" width="200" height="200" alt="Vue logo" :src="defaultImg">
    </q-card-section>
    <q-card-actions>
      <q-btn color="blue" label="画像を選択" @click="onUpload" />
      <q-btn color="orange" label="プレビュー" @click="onClicked" />
    </q-card-actions>
  </q-card> -->
</template>

<style scoped lang="scss">
img {
  display: block;

  /* This rule is very important, please don't ignore this */
  max-width: 100%;
}
</style>