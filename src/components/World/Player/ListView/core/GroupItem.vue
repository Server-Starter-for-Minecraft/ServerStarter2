<script setup lang="ts">
import { ref } from 'vue';
import { toEntries } from 'app/src-public/scripts/obj/obj';
import { PlayerUUID, UUID } from 'app/src-electron/schema/brands';
import { PlayerGroup } from 'app/src-electron/schema/player';
import { assets } from 'src/assets/assets';
import { $T } from 'src/i18n/utils/tFunc';
import { useSystemStore } from 'src/stores/SystemStore';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';
import { getColorLabel } from '../../utils/groupColor';
import GroupColorPicker from '../../utils/GroupColorPicker.vue';
import PlayerIcon from '../../utils/PlayerIcon.vue';
import EditableText from './parts/EditableText.vue';

const autoFocus = defineModel<boolean>({ required: true });

interface Prop {
  groupId: UUID;
  group: PlayerGroup;
}
const prop = defineProps<Prop>();

const sysStore = useSystemStore();
const playerStore = usePlayerStore();
const hovered = ref(false);
const editableName = ref(false);
const colorPickerOpened = ref(false);
const groupName = ref(sysStore.systemSettings.player.groups[prop.groupId].name);

const label2code = sysStore.staticResouces.minecraftColors;

type MenuBtn = {
  label: string;
  icon: string;
  color?: string;
  onClick: () => void;
};
const menuBtns: MenuBtn[] = [
  {
    label: $T('player.editGroupMember'),
    icon: 'group',
    onClick: () => {}, // TODO: メンバー編集用ダイアログを表示
  },
  {
    label: $T('player.renameGroup'),
    icon: 'edit',
    onClick: () => {
      // TODO: editableNameがTrueになっても編集モードにならない問題を修正
      editableName.value = true;
    },
  },
  {
    label: $T('player.changeGroupColor'),
    icon: 'palette',
    onClick: () => (colorPickerOpened.value = true),
  },
  {
    label: $T('player.deleteGroup'),
    icon: 'close',
    color: 'negative',
    onClick: () => playerStore.removeGroup(prop.groupId),
  },
];

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
    ? $T('player.groupNameDuplicate', { group: name })
    : $T('player.insertGroupName');
}
</script>

<template>
  <q-item
    clickable
    @mouseover="hovered = true"
    @mouseleave="hovered = false"
    @click="selectGroupMembers"
    class="q-px-none"
  >
    <div class="cropped-image-container">
      <q-img
        :src="assets.png[`${getColorLabel(label2code, group.color)}_wool`]"
        class="avaterImg cropped-image absolute-left"
      />
    </div>

    <q-item-section class="q-px-sm">
      <div class="row">
        {{ editableName }}
        <EditableText
          v-model:name="groupName"
          v-model:is-edit="editableName"
          :validater="(val) => validateGroupName(val) || validateMessage(val)"
          :auto-focus="autoFocus"
          class="col"
        />
        <q-btn outline dense icon="more_horiz" class="q-py-none" @click.stop>
          <q-menu auto-close>
            <q-list>
              <q-item
                v-for="item of menuBtns"
                :key="item.icon"
                clickable
                @click="item.onClick"
              >
                <q-item-section avatar>
                  <q-icon :color="item.color" :name="item.icon" />
                </q-item-section>
                <q-item-section :class="`text-${item.color}`">
                  {{ item.label }}
                </q-item-section>

                <q-item-section side v-if="item.icon === 'palette'">
                  <q-icon name="arrow_right" />
                </q-item-section>
                <!-- <QMenu
                  v-if="item.icon === 'palette'"
                  v-model="colorPickerOpened"
                >
                  <GroupColorPicker :group-id="groupId" :group="group" />
                </QMenu> -->
              </q-item>
            </q-list>
          </q-menu>
          <!-- TODO: 翻訳を追加 -->
          <SsTooltip
            name="グループ設定"
            self="center middle"
            anchor="top middle"
          />
        </q-btn>
      </div>

      <div class="row q-gutter-x-sm player-icons-container" style="width: 100%">
        <div
          v-for="pId in group.players"
          :key="pId"
          class="player-icon-wrapper"
        >
          <PlayerIcon :uuid="pId" head-size="1.2rem" />
        </div>
      </div>
    </q-item-section>

    <!-- <q-item-section side class="q-gutter-y-sm">
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
    </q-item-section> -->
  </q-item>
</template>

<style scoped lang="scss">
// 羊毛の画像を指定した幅分のみ表示する
.cropped-image-container {
  position: relative;
  width: 8px;
  overflow: hidden;
  flex-shrink: 0;
}
.cropped-image {
  position: absolute;
  left: 0;
  top: 0;
  max-height: 100%;
  image-rendering: pixelated;

  // 画像が正方形でない場合に備えて、アスペクト比を維持
  object-fit: cover;
  object-position: left center;
}

// グループメンバーのアイコンを横１行に並べる
.player-icons-container {
  overflow: hidden;
  white-space: nowrap;
  flex-wrap: nowrap;

  // マスクを使用して右端を透過させる
  mask: linear-gradient(
    to right,
    black 0%,
    black calc(100% - 5rem),
    transparent 100%
  );
}
.player-icon-wrapper {
  flex-shrink: 0;
  display: inline-block;
}

.avaterImg {
  image-rendering: pixelated;
}
</style>
