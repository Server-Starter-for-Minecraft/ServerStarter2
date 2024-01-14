<script setup lang="ts">
import { useRouter } from 'vue-router';
import DropBtnView from './dropBtnView.vue';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';

type DropBtn = {
  label: string;
  activeModelValue: string;
};

interface Prop {
  path: string;
  label: string;
  icon: string;
  btns: DropBtn[];
}
const prop = defineProps<Prop>();
const model = defineModel<string>({ required: true });
const router = useRouter();

/**
 * タブ内のボタンが選択された際には、
 * 　・どのボタンを選択しているかのモデルを更新し、
 * 　・ボタン群全体が所属するURLにアクセスする
 */
function btnClicked(btn: DropBtn) {
  model.value = btn.activeModelValue;
  router.push(`/${prop.path}`);
}
</script>

<template>
  <div class="relative-position self-stretch flex">
    <q-btn-dropdown
      auto-close
      stretch
      flat
      :icon="icon"
      :label="
        $q.screen.gt.md || $route.path.slice(0, 9) === '/contents'
          ? label
          : undefined
      "
      :class="$route.path.slice(0, 9) === '/contents' ? 'text-primary' : ''"
      style="
        padding-top: 8px;
        padding-bottom: 8px;
        margin-top: -4px;
        margin-bottom: -4px;
      "
    >
      <q-list>
        <template v-for="btn in btns" :key="btn">
          <DropBtnView
            :active="
              $route.path === `/${path}` && model === btn.activeModelValue
            "
            :label="btn.label"
            @click="btnClicked(btn)"
          />
        </template>
      </q-list>
    </q-btn-dropdown>

    <!-- indicator -->
    <div
      v-show="$route.path.slice(0, 9) === '/contents'"
      class="absolute-bottom bg-primary"
      style="height: 2px"
    />

    <SsTooltip
      v-if="!($q.screen.gt.md || $route.path.slice(0, 9) === '/contents')"
      :name="label"
      anchor="center middle"
      self="top middle"
    />
  </div>
</template>
