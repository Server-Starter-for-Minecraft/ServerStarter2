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

/**
 * 切り抜き処理の世代
 * 画像の操作が続いた場合に，古い処理の結果で新しい結果を上書きしないために利用する
 */
let generation = 0;

function readAsDataURL(blob: Blob) {
  return new Promise<ImageURI>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ImageURI);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function updateImg() {
  const current = ++generation;
  const isLatest = () => current === generation;
  let succeeded = false;
  iconImg.value.processing = true;

  try {
    const image = cropper?.getCropperImage();
    const selection = cropper?.getCropperSelection();
    if (!image || !selection) return;

    // 元画像の解像度で切り抜くため，画像の拡大率から出力サイズを算出する
    const scale = image.$getTransform()[0] || 1;
    const width = Math.round(selection.width / scale);
    const height = Math.round(selection.height / scale);

    // Cropper.jsの出力をcanvas要素形式で受け取る
    const canvas = await selection.$toCanvas({ width, height });
    if (!isLatest()) return;

    // canvas要素をBlob形式に変換する
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve)
    );
    if (!blob || !isLatest()) return;

    // Browser Image CompressionなどのJavaScriptモジュールを使用して圧縮する
    const compressedBlob = await imageCompression(blob as File, {
      maxSizeMB: 1,
      maxWidthOrHeight: 64,
    });
    if (!isLatest()) return;

    // compressedBlobをbase64形式の文字列に変換する
    const data = await readAsDataURL(compressedBlob);
    if (!isLatest()) return;

    // 画像のサイズとデータをセット
    iconImg.value.width = canvas.width;
    iconImg.value.height = canvas.height;
    iconImg.value.data = data;
    succeeded = true;
  } finally {
    if (isLatest()) {
      // 切り抜きに失敗した場合は，切り抜き前の画像を登録させないためにサイズを無効化する
      if (!succeeded) {
        iconImg.value.width = 0;
        iconImg.value.height = 0;
      }
      iconImg.value.processing = false;
    }
  }
}

const debouncedUpdateImg = debounce(updateImg, 100);

onMounted(async () => {
  if (!cropImg.value) return;
  cropper = new Cropper(cropImg.value, { template: CROPPER_TEMPLATE });

  const image = cropper.getCropperImage();
  image?.addEventListener('transform', () => {
    // 操作された時点で処理中とし，切り抜きが完了するまで登録させない
    iconImg.value.processing = true;
    debouncedUpdateImg();
  });
  await image?.$ready();
  await updateImg();
});

onBeforeUnmount(() => {
  // 実行中の処理の結果を破棄する
  // (processingは次に表示されるClipImgの切り抜きが完了するまで維持する)
  generation++;
  debouncedUpdateImg.cancel();
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

// 切り抜き枠はキャンバス全体を覆うため，ポインター操作を下の移動用ハンドルに通して
// ドラッグで画像を移動できるようにする
.clip-img :deep(cropper-selection) {
  pointer-events: none;
}
</style>
