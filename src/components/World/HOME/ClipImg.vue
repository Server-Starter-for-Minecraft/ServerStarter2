<script setup lang="ts">
import { onMounted, ref } from 'vue';
import "cropperjs/dist/cropper.css";
import Cropper from 'cropperjs';

const cropImg = ref()
let cropper: Cropper | undefined = undefined
const cropperImg = ref()

function onClicked() {
  cropperImg.value =  cropper?.getCroppedCanvas().toDataURL()
}

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
  <q-card style="width: 400px;">
    <q-card-section>
      <img ref="cropImg" width="200" height="200" alt="Vue logo" src="https://cdn.quasar.dev/img/linux-avatar.png">
    </q-card-section>
    <q-card-actions>
      <q-btn label="画像を取得" @click="onClicked" />
    </q-card-actions>
    <q-card-section>
      <q-img sizes="200px" :src="cropperImg" />
    </q-card-section>
  </q-card>
</template>