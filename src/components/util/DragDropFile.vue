<script setup lang="ts">
import { ref } from 'vue';
import SsI18nT from './base/ssI18nT.vue';

interface Prop {
  /** ドラッグ＆ドロップされたときの処理 */
  draged: (path: string[]) => void;
  acceptExt: string;
}
const prop = defineProps<Prop>();

const dropFileBox = ref();
const isDragging = ref(false);

function onChange() {
  const targetPaths: string[] = [];
  const files = dropFileBox.value.files as FileList;

  for (let i = 0; i < files.length; i++) {
    const file = files.item(i);
    if (file) {
      targetPaths.push(file.path);
    }
  }

  prop.draged(targetPaths);
}

function dragover(e: DragEvent) {
  e.preventDefault();
  isDragging.value = true;
}
function dragleave() {
  isDragging.value = false;
}

function drop(e: DragEvent) {
  e.preventDefault();
  dropFileBox.value.files = e.dataTransfer?.files;
  onChange();
  isDragging.value = false;
}
</script>

<template>
  <div class="main">
    <div
      :class="isDragging ? 'dropzone-container-active' : 'dropzone-container'"
      @dragover="dragover"
      @dragleave="dragleave"
      @drop="drop"
    >
      <input
        type="file"
        multiple
        name="file"
        id="fileInput"
        class="hidden-input"
        @change="onChange"
        ref="dropFileBox"
        :accept="acceptExt"
      />

      <label for="fileInput" class="file-label">
        <SsI18nT
          :keypath="`additionalContents.dragdrop.${
            isDragging ? 'dragging' : 'default'
          }`"
        >
          <u class="text-primary">
            {{ $t('additionalContents.dragdrop.click') }}
          </u>
        </SsI18nT>
      </label>
    </div>
  </div>
</template>

<style scoped lang="scss">
.main {
  flex-grow: 1;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.dropzone-container {
  padding: 4rem 0rem;
  border: 1px dashed #e2e8f0;
  border-radius: 3px;
}

.dropzone-container-active {
  padding: 4rem 0rem;
  border: 3px dashed $primary;
  border-radius: 3px;
}

.hidden-input {
  opacity: 0;
  overflow: hidden;
  position: absolute;
  width: 1px;
  height: 1px;
}

.file-label {
  font-size: 20px;
  display: block;
  cursor: pointer;
}
</style>
