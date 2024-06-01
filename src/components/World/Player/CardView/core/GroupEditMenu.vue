<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { keys, values } from 'app/src-public/scripts/obj/obj';
import { PlayerGroup } from 'app/src-electron/schema/player';
import { useSystemStore } from 'src/stores/SystemStore';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import SsInput from 'src/components/util/base/ssInput.vue';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';

const sysStore = useSystemStore();
const playerStore = usePlayerStore();

const colorOps = keys(sysStore.staticResouces.minecraftColors).map((k) => {
  return { label: k, code: sysStore.staticResouces.minecraftColors[k] };
});
const groupName = computed({
  get: () =>
    sysStore.systemSettings.player.groups[playerStore.selectedGroupId].name,
  set: (newVal) => {
    sysStore.systemSettings.player.groups[playerStore.selectedGroupId].name =
      newVal;
  },
});
const groupColor = computed({
  get: () =>
    sysStore.systemSettings.player.groups[playerStore.selectedGroupId].color,
  set: (newVal) => {
    sysStore.systemSettings.player.groups[playerStore.selectedGroupId].color =
      newVal;
  },
});

const { t } = useI18n();

/**
 * 入力グループ名のバリデーション
 */
function validateGroupName(name: string) {
  return (
    name !== '' &&
    !(
      name !== groupName.value &&
      values(playerStore.searchGroups()).some((g) => g.name === name)
    )
  );
}
function validateMessage(name: string) {
  return name !== ''
    ? t('player.groupNameDuplicate', { group: name })
    : t('player.insertGroupName');
}

function removeGroup() {
  playerStore.openGroupEditor = false
  playerStore.removeGroup(playerStore.selectedGroupId)
}
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

    <q-scroll-area style="flex: 1 1 0">
      <q-card-section class="q-pt-xs q-pb-none">
        <span class="text-caption">{{ $t('player.groupName') }}</span>
        <SsInput
          v-model="groupName"
          dense
          :rules="[(val) => validateGroupName(val) || validateMessage(val)]"
        />
      </q-card-section>

      <q-card-section class="column q-pb-xs">
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

      <!-- <q-card-section class="q-pb-sm">
        <q-btn
          outline
          :label="$t(isNewGroup ? 'player.makeNewGroup' : 'player.updateGroup')"
          :disable="
            playerStore.focusCards.size === 0 || !validateGroupName(group.name)
          "
          color="primary"
          @click="
            !isNewGroup && groupId
              ? playerStore.updateGroup(groupId, buildGroup())
              : playerStore.addGroup(buildGroup())
          "
          class="full-width"
        />
      </q-card-section> -->

      <!-- <q-card-section
        v-show="group.name !== ''"
        class="q-pt-none q-pb-sm"
        style="font-size: 0.7rem"
      >
        <span v-if="playerStore.focusCards.size === 0">
          {{ $t('player.selectPlayer') }}
        </span>
        <span v-else>
          {{
            isNewGroup
              ? $t('player.makeNewGroupDecide', {
                  group: group.name,
                  n: playerStore.focusCards.size,
                })
              : $t('player.updateGroupDecide', {
                  group: group.name,
                  n: playerStore.focusCards.size,
                })
          }}
        </span>
      </q-card-section> -->

      <!-- <q-separator v-if="!isNewGroup" inset /> -->

      <q-card-section>
        <q-btn
          outline
          :label="$t('player.deleteGroup')"
          color="negative"
          @click="removeGroup()"
          class="full-width"
        />
      </q-card-section>
    </q-scroll-area>
  </q-card>
</template>

<style scoped lang="scss">
.card {
  width: 13rem;
  height: 300px;
  max-height: 50vh;
}
</style>
