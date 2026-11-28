<script setup lang="ts" generic="T">
import { computed, ref } from 'vue';
import { $T } from 'src/i18n/utils/tFunc';
import SsInput from './ssInput.vue';

interface Prop {
  options?: readonly unknown[];
  label?: string;
  disable?: boolean;
  dense?: boolean;
  optionLabel?: string;
  optionValue?: string;
  /**
   * 「その他」を入力できるようにする
   */
  enableOther?: boolean;
}

const prop = defineProps<Prop>();
const model = defineModel<T>({ required: true });

const definedOptionLabel = prop.optionLabel ?? 'label';
const definedOptionValue = prop.optionValue ?? 'value';
// 特殊なキーであるOtherを追加
const OTHER_DATA = 'other';

/**
 * 「その他」を表す文字列を，モデルの型として返す
 *
 * 「その他」の選択肢はモデルが文字列の場合にのみ表示するため，モデルの型として扱える
 * （ジェネリクスの型を文字列に絞り込めないため，lint の例外として型アサーションを許可している）
 *
 * @returns 「その他」を表す値
 */
function otherAsModel(): T {
  return OTHER_DATA as T;
}

/**
 * 与えられた要素が構造体でない場合，
 * `definedOptionLabel`と`definedOptionValue`をキーとして持つ構造体を返す
 */
function convertStructure(modelVal: unknown): object {
  if (typeof modelVal === 'object' && modelVal !== null) return modelVal;
  return {
    [definedOptionLabel]: modelVal,
    [definedOptionValue]: modelVal,
  };
}

const getOptions = (ops?: readonly unknown[]) => {
  // 選択肢一覧を構造化し，「その他」の多言語表示に対応する
  const editedOptions: object[] = (ops ?? []).map(convertStructure);

  // 選択肢一覧に「その他」を追加する
  // （本来はT型しか入れられないところに強引にOtherを入れるため，Modelが文字列型の時のみ対応する）
  // --> Modelの型制限が過剰な場合は適切な検証のもとに制限を緩和しても良い
  if (prop.enableOther && typeof model.value === 'string') {
    editedOptions.push({
      [definedOptionLabel]: $T('general.other'),
      [definedOptionValue]: OTHER_DATA,
    });
  }

  return editedOptions;
};

// model.valueがOptionsに含まれているかどうかを判定する
// Objectが来た時に包含判定が崩れないよう，inを使わずにsomeを使う
const checkInOptions = () =>
  prop.options?.some((val) => val === model.value) ?? true;
// InputBoxにフォーカスが当たっているかどうか
const isFocusInput = ref(false);

// 「その他」を考慮する場合にSelectBoxに表示する内容を決定する
const computedModel = computed({
  get: () => {
    if (!prop.enableOther || (prop.options?.length ?? 0) === 0) {
      return model.value;
    }
    return checkInOptions() ? model.value : otherAsModel();
  },
  set: (newVal) => {
    model.value = newVal;
  },
});
</script>

<template>
  <div>
    <q-select
      v-model="computedModel"
      filled
      :options="getOptions(options)"
      :label="label"
      :dense="dense"
      :popup-content-style="{ fontSize: '0.9rem' }"
      :disable="disable"
      emit-value
      map-options
      :option-label="definedOptionLabel"
      :option-value="definedOptionValue"
      style="font-size: 0.9rem"
    />
    <!-- 入力途中で偶然Optionsにある内容を入力したとしても，
         突然InputBoxが消えることがないように`isInputFocus`を考慮する -->
    <SsInput
      v-if="typeof model === 'string'"
      v-show="(prop.enableOther && !checkInOptions()) || isFocusInput"
      v-model="model"
      dense
      :disable="disable"
      @focusin="isFocusInput = true"
      @focusout="isFocusInput = false"
      class="q-pt-sm"
    />
  </div>
</template>
