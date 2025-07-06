<script setup lang="ts">
import { $T } from 'src/i18n/utils/tFunc';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';

interface Prop {
  autoFocus: boolean;
  validater: (text: any) => boolean | string;
}
const prop = defineProps<Prop>();

const text = defineModel<string>('name', { required: true });
let oldName = text.value;

const isEdit = defineModel<boolean>('isEdit', {
  required: true,
  get(value) {
    return value;
  },
  set(value) {
    // 編集モードを解除する際に，バリデーションがエラーの場合は元の名称を入れて戻す
    if (!value && prop.validater(text.value) !== true) {
      text.value = oldName;
    } else {
      oldName = text.value;
    }
    return value;
  },
});
</script>

<template>
  <p
    v-if="!isEdit"
    @dblclick.stop="isEdit = true"
    class="text text-omit q-ma-none"
  >
    {{ text }}
  </p>
  <q-input
    v-else
    v-model="text"
    :autofocus="autoFocus"
    dense
    filled
    :rules="[validater]"
    class="text q-pa-none"
    :class="validater(text) !== true ? 'q-pb-md' : 'q-pb-xs'"
    @click.stop
  >
    <template #append>
      <q-btn
        v-if="validater(text) !== true"
        icon="close"
        color="negative"
        dense
        flat
        @click.stop="isEdit = false"
        style="margin-right: -12px"
      >
        <SsTooltip
          :name="$T('general.cancel')"
          self="center left"
          anchor="center right"
          :offset="[0, 5]"
        />
      </q-btn>
      <q-btn
        v-else
        icon="check"
        color="primary"
        dense
        flat
        @click.stop="isEdit = false"
        style="margin-right: -12px"
      >
        <SsTooltip
          :name="$T('player.decideGroupName')"
          self="center left"
          anchor="center right"
          :offset="[0, 5]"
        />
      </q-btn>
    </template>
  </q-input>
</template>

<style lang="scss" scoped>
.text {
  font-size: 1rem;
  max-width: 100%;
}
</style>
