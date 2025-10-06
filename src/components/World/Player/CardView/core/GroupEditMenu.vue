<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { isValid } from 'app/src-public/scripts/error';
import { keys, toEntries } from 'app/src-public/scripts/obj/obj';
import { useSystemStore } from 'src/stores/SystemStore';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import SsInput from 'src/components/util/base/ssInput.vue';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';

const { t } = useI18n();
const sysStore = useSystemStore();
const playerStore = usePlayerStore();

const mcColors = sysStore.staticResouces.minecraftColors;
const targetGroup = computed(() => {
  return sysStore.systemSettings.player.groups[playerStore.selectedGroupId];
});

const colorOps = keys(mcColors).map((k) => {
  return { label: k, code: mcColors[k] };
});
const groupName = ref(targetGroup.value.name);
const groupColor = computed({
  get: () => targetGroup.value.color,
  set: (newVal) => {
    targetGroup.value.color = newVal;
  },
});

/**
 * 入力グループ名のバリデーション
 */
function validateGroupName(groupName: string) {
  // 自分以外のグループ名一覧を取得
  const groupNames = toEntries(sysStore.systemSettings.player.groups)
    .filter(([gId, g]) => gId !== playerStore.selectedGroupId)
    .map(([gId, g]) => g.name);
  const isError =
    groupName === '' || groupNames.some((name) => name === groupName);

  // エラーでなければグループ名を更新
  if (!isError) {
    targetGroup.value.name = groupName;
  }

  return !isError;
}
function validateMessage(name: string) {
  return name !== ''
    ? t('player.groupNameDuplicate', { group: name })
    : t('player.insertGroupName');
}

function removeGroup() {
  playerStore.openGroupEditor = false;
  playerStore.removeGroup(playerStore.selectedGroupId);
}

onMounted(async () => {
  // グループメンバーにフォーカスをあてる
  const players = await Promise.all(
    targetGroup.value.players.map((pId) =>
      window.API.invokeGetPlayer(pId, 'uuid')
    )
  );
  const filteredPlayers = players.filter(isValid);
  filteredPlayers.forEach(playerStore.addFocus);
});
</script>

<template>
  <q-card flat class="column card">
    <p class="q-py-sm q-pl-md q-ma-none text-body2">
      {{ $t('player.editGroup') }}
    </p>

    <div class="absolute-top-right">
      <q-btn
        dense
        icon="close"
        class="q-pa-sm"
        @click="playerStore.openGroupEditor = false"
      />
    </div>

    <q-card-section class="q-pt-xs q-pb-none">
      <span class="text-caption">{{ $t('player.groupName') }}</span>
      <SsInput
        v-model="groupName"
        autofocus
        dense
        :rules="[(val) => validateGroupName(val) || validateMessage(val)]"
      />
    </q-card-section>

    <q-card-section class="column q-pt-sm">
      <span class="text-caption">{{ $t('player.groupColor') }}</span>
      <q-btn-dropdown
        dense
        icon="circle"
        menu-anchor="bottom left"
        menu-self="top left"
        :style="{
          color: groupColor,
          width: 'min-content',
        }"
      >
        <div
          class="q-gutter-sm row q-pa-xs"
          style="width: 136px; margin: 0 auto"
        >
          <template v-for="colorOp in colorOps" :key="colorOp">
            <q-btn
              v-close-popup
              dense
              flat
              icon="circle"
              class="q-ma-none"
              :style="{ color: colorOp.code }"
              @click="groupColor = colorOp.code"
            >
              <SsTooltip
                :name="$t(`player.color.${colorOp.label}`)"
                anchor="bottom middle"
                self="center middle"
              />
            </q-btn>
          </template>
        </div>
      </q-btn-dropdown>
    </q-card-section>

    <q-separator inset />

    <q-card-section>
      <q-btn
        outline
        :label="$t('player.deleteGroup.title')"
        color="negative"
        @click="removeGroup()"
        class="full-width"
      />
    </q-card-section>
  </q-card>
</template>

<style scoped lang="scss">
.card {
  width: 13rem;
  max-height: 50vh;
}
</style>
