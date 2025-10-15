<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { deepcopy } from 'app/src-public/scripts/deepcopy';
import { toEntries } from 'app/src-public/scripts/obj/obj';
import { $T } from 'src/i18n/utils/tFunc';
import { useSystemStore } from 'src/stores/SystemStore';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import { dangerDialogProp } from 'src/components/util/danger/iDangerDialog';
import SsInput from 'src/components/util/base/ssInput.vue';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';
import DangerDialog from 'src/components/util/danger/DangerDialog.vue';

const $q = useQuasar();
const sysStore = useSystemStore();
const playerStore = usePlayerStore();

const mcColors = sysStore.staticResouces.minecraftColors;
const tmpGroupSettings = deepcopy(
  sysStore.systemSettings.player.groups[playerStore.selectedGroupId]
);

const colorOps = toEntries(mcColors).map(([k, v]) => {
  return { label: k, code: v };
});
const groupName = ref(tmpGroupSettings.name);
const groupColor = ref(tmpGroupSettings.color);

const isValidName = ref(true);
const isValidGroup = computed(
  () => isValidName.value && playerStore.focusPlayerIds.size > 0
);

/**
 * 入力グループ名のバリデーション
 */
function validateGroupName(gName: string) {
  // 自分以外のグループ名一覧を取得
  const groupNames = toEntries(sysStore.systemSettings.player.groups)
    .filter(([gId, g]) => gId !== playerStore.selectedGroupId)
    .map(([gId, g]) => g.name);
  isValidName.value =
    gName !== '' && !groupNames.some((name) => name === gName);

  // エラーでなければグループ名を更新
  if (isValidName.value) {
    groupName.value = gName;
  }

  return isValidName.value;
}
function validateMessage(name: string) {
  return name !== ''
    ? $T('player.groupNameDuplicate', { group: name })
    : $T('player.insertGroupName');
}

function closeMenu() {
  playerStore.openGroupEditor = false;
  playerStore.unFocus();
}

function updateGroup() {
  playerStore.updateGroup(playerStore.selectedGroupId, (g) => {
    g.name = groupName.value;
    g.color = groupColor.value;
    g.players = Array.from(playerStore.focusPlayerIds);
    return g;
  });
  closeMenu();
}

function removeGroup() {
  $q.dialog({
    component: DangerDialog,
    componentProps: {
      dialogTitle: $T('player.deleteGroup.title'),
      dialogDesc: $T('player.deleteGroup.desc', {
        groupname: tmpGroupSettings.name,
      }),
      okBtnTxt: $T('player.deleteGroup.okBtn'),
    } as dangerDialogProp,
  }).onOk(() => {
    playerStore.removeGroup(playerStore.selectedGroupId);
    closeMenu();
  });
}

onMounted(playerStore.selectGroup(playerStore.selectedGroupId, false));
</script>

<template>
  <q-card flat class="column card">
    <p class="q-py-sm q-pl-md q-ma-none text-body2">
      {{ $t('player.editGroup') }}
    </p>

    <div class="absolute-top-right">
      <q-btn dense icon="close" class="q-pa-sm" @click="closeMenu()" />
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

    <q-card-section class="q-gutter-y-md">
      <q-btn
        outline
        :disable="!isValidGroup"
        :label="$t('player.updateGroup')"
        color="primary"
        @click="updateGroup()"
        class="full-width"
      />
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
