<script setup lang="ts">
import { ref } from 'vue';
import SsA from 'src/components/util/base/ssA.vue';
import { urlAnalyzer } from './textAnalyzer';

const contentDesc = defineModel<string>({ required: true });
const descEditMode = ref(false);
const scrollAreaRef = ref();
const textAreaRef = ref();
const height = '10rem';

function getFocus() {
  descEditMode.value = true;
  textAreaRef.value.focus();
  // 初期の選択を文字列の末尾にする
  textAreaRef.value.scrollTop = 99999
}

function lostFocus() {
  descEditMode.value = false;
}
</script>

<template>
  <q-field outlined @focus="getFocus" @blur="lostFocus">
    <template v-slot:control>
      <q-scroll-area
        ref="scrollAreaRef"
        v-show="!descEditMode"
        class="fit"
        :style="{ 'min-height': height }"
      >
        <div
          class="q-py-sm"
          :class="contentDesc === '' ? 'placeholder' : ''"
          style="word-break: break-all"
        >
          <span v-if="contentDesc === ''">クリックしてメモを編集</span>
          <!-- 生成した行を連ねる -->
          <template
            v-else
            v-for="(urlTxts, idx) in urlAnalyzer(contentDesc)"
            :key="idx"
          >
            <!-- 一行を生成 -->
            <div class="full-width row">
              <template v-for="(urlTxt, _idx) in urlTxts" :key="_idx">
                <div
                  v-if="urlTxt.type === 'txt' && urlTxt.value !== ''"
                  style="white-space: pre-wrap"
                >
                  {{ urlTxt.value }}
                </div>
                <!-- 改行だけの行が描画されるように半角スペースを入れて描画 -->
                <div
                  v-if="
                    urlTxts.length === 1 &&
                    urlTxt.type === 'txt' &&
                    urlTxt.value === ''
                  "
                >
                  &nbsp;
                </div>
                <SsA
                  v-else-if="urlTxt.type === 'url'"
                  :url="urlTxt.value"
                  @click.stop="() => {}"
                >
                  {{ urlTxt.value }}
                </SsA>
              </template>
            </div>
          </template>
        </div>
      </q-scroll-area>

      <textarea
        v-show="descEditMode"
        v-model="contentDesc"
        ref="textAreaRef"
        class="textarea innerField no-outline q-py-sm"
        :class="$q.dark.isActive ? 'q-dark' : ''"
        @click.stop="() => {}"
        tabindex="0"
      ></textarea>
    </template>
  </q-field>
</template>

<style scoped lang="scss">
.innerField {
  height: 10rem;
}

.placeholder {
  opacity: 0.6;
}

.textarea {
  resize: none;
  background-color: transparent;
  border: transparent;
  width: 100%;
}
</style>
