<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { toEntries } from 'app/src-public/scripts/obj/obj';
import { PlayerUUID, UUID } from 'app/src-electron/schema/brands';
import { PlayerGroup } from 'app/src-electron/schema/player';
import { useSystemStore } from 'src/stores/SystemStore';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';
import PlayerIcon from '../../utils/PlayerIcon.vue';
import GroupColorPicker from './parts/GroupColorPicker.vue';

const autoFocus = defineModel<boolean>({ required: true });

interface Prop {
  groupId: UUID;
  group: PlayerGroup;
}
const prop = defineProps<Prop>();

const { t } = useI18n();
const sysStore = useSystemStore();
const playerStore = usePlayerStore();
const hovered = ref(false);
const groupName = ref(sysStore.systemSettings.player.groups[prop.groupId].name);

function addMember(uuid: PlayerUUID) {
  playerStore.updateGroup(prop.groupId, (g) => {
    if (g.players.indexOf(uuid) === -1) {
      g.players.push(uuid);
    }
    return g;
  });
  playerStore.unFocus();
}

function selectGroupMembers() {
  playerStore.selectGroup(prop.group.name);
}

function changeColor(colorCode: string) {
  playerStore.updateGroup(prop.groupId, (g) => {
    g.color = colorCode;
    return g;
  });
}

function removeMember(uuid: PlayerUUID) {
  playerStore.updateGroup(prop.groupId, (g) => {
    g.players.splice(g.players.indexOf(uuid), 1);
    return g;
  });
}

/**
 * 入力グループ名のバリデーション
 */
function validateGroupName(groupName: string) {
  // 自分以外のグループ名一覧を取得
  const groupNames = toEntries(playerStore.searchGroups())
    .filter(([gId, g]) => gId !== prop.groupId)
    .map(([gId, g]) => g.name);
  const isError =
    groupName === '' || groupNames.some((name) => name === groupName);

  // エラーでなければグループ名を更新
  if (!isError) {
    sysStore.systemSettings.player.groups[prop.groupId].name = groupName;
  }

  return !isError;
}
function validateMessage(name: string) {
  return name !== ''
    ? t('player.groupNameDuplicate', { group: name })
    : t('player.insertGroupName');
}
</script>

<template>
  <q-item
    clickable
    @mouseover="hovered = true"
    @mouseleave="hovered = false"
    @click="selectGroupMembers"
  >
    <q-item-section>
      <div class="row q-gutter-md items-start">
        <!-- 背景要素である`q-item`にクリックイベントが伝播しないように@click.stopでラップ -->
        <div @click.stop class="q-ml-none">
          <GroupColorPicker
            :group-color="group.color"
            :change-color="changeColor"
          />
        </div>

        <div @click.stop>
          <q-input
            v-model="groupName"
            :autofocus="autoFocus"
            flat
            dense
            :rules="[(val) => validateGroupName(val) || validateMessage(val)]"
            style="font-size: 1.2rem"
          />
        </div>
      </div>

      <div class="q-pl-md row q-gutter-sm">
        <div v-for="pId in group.players" :key="pId">
          <PlayerIcon
            hover-btn
            :uuid="pId"
            :negative-btn-clicked="removeMember"
          />
        </div>
      </div>
    </q-item-section>

    <q-item-section avatar class="q-gutter-y-sm">
      <SsBtn
        free-width
        flat
        dense
        :disable="playerStore.focusCards.size === 0"
        icon="person_add"
        color="primary"
        size="1rem"
        @click.stop="playerStore.focusCards.forEach(addMember)"
      >
        <SsTooltip
          v-if="playerStore.focusCards.size !== 0"
          :name="$t('player.groupingBtn')"
          self="center middle"
          anchor="center start"
        />
      </SsBtn>
      <q-btn
        free-width
        flat
        dense
        icon="close"
        color="negative"
        size="1rem"
        @click.stop="playerStore.removeGroup(groupId)"
      >
        <SsTooltip
          :name="$t('player.deleteGroup')"
          self="center middle"
          anchor="center start"
        />
      </q-btn>
    </q-item-section>
  </q-item>
</template>

<style scoped lang="scss">
.avaterImg {
  position: absolute;
  image-rendering: pixelated;
}
</style>
