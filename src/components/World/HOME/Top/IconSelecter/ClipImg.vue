<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { debounce } from 'quasar';
import imageCompression from 'browser-image-compression';
import Cropper from 'cropperjs';
import { ImageURI } from 'app/src-electron/schema/brands';
import { IconImage } from './iIconSelect';

const iconImg = defineModel<IconImage>({ required: true });

const cropImg = ref<HTMLImageElement>();
let cropper: Cropper | undefined = undefined;

/**
 * 画像を正方形の枠に合わせて移動・拡大縮小して切り抜くテンプレート
 * （旧Cropper.jsの dragMode: 'move', aspectRatio: 1, autoCropArea: 1 相当）
 */
const CROPPER_TEMPLATE =
  '<cropper-canvas>' +
  '<cropper-image initial-center-size="cover" scalable translatable></cropper-image>' +
  '<cropper-handle action="move" plain></cropper-handle>' +
  '<cropper-selection aspect-ratio="1" initial-coverage="1" outlined></cropper-selection>' +
  '</cropper-canvas>';

async function updateImg() {
  const image = cropper?.getCropperImage();
  const selection = cropper?.getCropperSelection();
  if (!image || !selection) return;

  // 元画像の解像度で切り抜くため，画像の拡大率から出力サイズを算出する
  const scale = image.$getTransform()[0] || 1;
  const width = Math.round(selection.width / scale);
  const height = Math.round(selection.height / scale);

  // Cropper.jsの出力をcanvas要素形式で受け取る
  const canvas = await selection.$toCanvas({ width, height });

  // 画像のサイズをセット
  iconImg.value.width = canvas.width;
  iconImg.value.height = canvas.height;

  // canvas要素をBlob形式に変換する
  canvas.toBlob((blob) => {
    // Browser Image CompressionなどのJavaScriptモジュールを使用して圧縮する
    imageCompression(blob as File, {
      maxSizeMB: 1,
      maxWidthOrHeight: 64,
    }).then((compressedBlob) => {
      // compressedBlobをbase64形式の文字列に変換する
      const reader = new FileReader();
      reader.readAsDataURL(compressedBlob);
      reader.onloadend = () => {
        iconImg.value.data = reader.result as ImageURI;
      };
    });
  });
}

onMounted(async () => {
  if (!cropImg.value) return;
  cropper = new Cropper(cropImg.value, { template: CROPPER_TEMPLATE });

  const image = cropper.getCropperImage();
  image?.addEventListener('transform', debounce(updateImg, 100));
  await image?.$ready();
  await updateImg();
});

onBeforeUnmount(() => {
  cropper?.destroy();
});
</script>

<template>
  <q-card flat class="clip-img">
    <img ref="cropImg" alt="Vue logo" :src="iconImg.data" />
  </q-card>
</template>

<style scoped lang="scss">
.clip-img :deep(cropper-canvas) {
  min-width: 300px;
  min-height: 300px;
  aspect-ratio: 1;

  /* This rule is very important, please don't ignore this */
  max-width: 100%;
}
</style>
