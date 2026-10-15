<script setup lang="ts">
import { getCssVar } from 'quasar';
import { tError } from 'src/i18n/utils/tFunc';
import { checkError } from 'src/components/Error/Error';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';

/**
 * システム設定に登録するフォルダを表示するカードの共通部分
 *
 * フォルダ名・パス・フォルダを開くボタン・表示切替ボタンを表示し，
 * 編集や登録解除などの操作ボタンは actions スロットで追加する
 */
interface Prop {
  /** フォルダの表示名 */
  title: string;
  /** フォルダのパス */
  path: string;
  /** 表示中のワールドの一覧などに，このフォルダを表示している場合の説明 */
  tooltipVisible: string;
  /** 表示していない場合の説明 */
  tooltipInvisible: string;
  /** 読み込み中の表示にする */
  loading?: boolean;
  /** カードのクリック操作を無効にする(フォルダを開くボタンなどは無効にしない) */
  disable?: boolean;
  /** 選択中の表示にする */
  active?: boolean;
  /** フォルダを開くボタンを無効にする */
  disableOpen?: boolean;
  /** 表示切替ボタンを無効にする */
  disableVisible?: boolean;
  /** カードをクリックしたときの処理(指定しない場合はクリックできない) */
  onClick?: () => void;
}
defineProps<Prop>();
/** フォルダを表示するか */
const visible = defineModel<boolean>('visible', { required: true });

/**
 * エクスプローラーでフォルダを開く
 * @param path 開くフォルダのパス
 */
async function openFolder(path: string) {
  const res = await window.API.invokeOpenFolder(path, false);
  checkError(res, undefined, (e) => tError(e));
}

/** 選択中・無効の状態に応じたカードのクラスを返す */
function getCardSytleClass(active?: boolean, disable?: boolean) {
  const returnClasses = ['column'];
  if (active) returnClasses.push('text-primary');
  if (disable) returnClasses.push('disable');
  return returnClasses.join(' ');
}
</script>

<template>
  <q-card
    flat
    bordered
    class="card fit row no-wrap items-center"
    :style="{ 'border-color': active ? getCssVar('primary') : 'transparent' }"
  >
    <!-- パスが長い場合も操作ボタンと重ならないよう，ボタンの左側の幅に収めて省略表示する -->
    <q-item
      class="col"
      style="min-width: 0"
      :clickable="onClick !== void 0 && !disable"
      @click="onClick"
      :class="getCardSytleClass(active, disable || loading)"
    >
      <div class="row items-center no-wrap q-gutter-x-sm">
        <div class="text-omit" style="font-size: 1.1rem">
          {{ title }}
          <SsTooltip :name="title" anchor="bottom start" self="center start" />
        </div>
        <slot name="title-append" />
      </div>
      <div class="text-caption text-omit" style="opacity: 0.6">
        {{ path }}
        <SsTooltip :name="path" anchor="bottom start" self="center start" />
      </div>
    </q-item>

    <div class="col-auto row no-wrap items-center q-gutter-x-sm q-pr-md">
      <SsBtn
        dense
        free-width
        icon="folder_open"
        :disable="disableOpen"
        @click="openFolder(path)"
      >
        <SsTooltip
          :name="$t('others.worldFolder.openFolder')"
          anchor="bottom middle"
          self="center middle"
        />
      </SsBtn>

      <SsBtn
        dense
        free-width
        :icon="visible ? 'visibility' : 'visibility_off'"
        :disable="disableVisible"
        @click="visible = !visible"
      >
        <SsTooltip
          :name="visible ? tooltipVisible : tooltipInvisible"
          anchor="bottom middle"
          self="center middle"
        />
      </SsBtn>
      <slot name="actions" />
    </div>

    <div class="absolute-center">
      <q-circular-progress
        v-show="loading"
        indeterminate
        rounded
        size="40px"
        color="primary"
        class="q-ma-md"
      />
    </div>
  </q-card>
</template>

<style scoped lang="scss">
.card {
  border-radius: 5px;
}

.disable {
  opacity: 0.6;
  outline: 0;
  cursor: not-allowed;
}
</style>
