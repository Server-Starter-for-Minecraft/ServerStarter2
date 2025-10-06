<script setup lang="ts">
import { type Component, ref } from 'vue';
import { useQuasar } from 'quasar';
import { values } from 'app/src-public/scripts/obj/obj';
import { UUID } from 'app/src-electron/schema/brands';
import { PlayerGroup } from 'app/src-electron/schema/player';
import { assets } from 'src/assets/assets';
import { $T } from 'src/i18n/utils/tFunc';
import { useSystemStore } from 'src/stores/SystemStore';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import { dangerDialogProp } from 'src/components/util/danger/iDangerDialog';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';
import DangerDialog from 'src/components/util/danger/DangerDialog.vue';
import { getColorLabel } from '../../utils/groupColor';
import GroupColorPicker from '../../utils/GroupColorPicker.vue';
import LoadPlayerHead from '../../utils/LoadPlayerHead.vue';
import GroupMemberDialog from './GroupMemberDialog.vue';
import { GroupMemberReturns, GroupMembersProp } from './iGroupMember';
import EditableText from './parts/EditableText.vue';

const autoFocus = defineModel<boolean>({ required: true });

interface Prop {
  groupId: UUID;
  group: PlayerGroup;
}
const prop = defineProps<Prop>();

const $q = useQuasar();
const sysStore = useSystemStore();
const playerStore = usePlayerStore();
const hovered = ref(false);
const editableName = ref(false);
const colorPickerOpened = ref(false);
const groupName = ref(prop.group.name);
const label2code = sysStore.staticResouces.minecraftColors;

type MenuBtn = {
  label: string;
  icon: string;
  color?: string;
  nestedItem?: Component;
  nestedProps?: Record<string, any>;
  onClick: () => void;
};
const menuBtns: MenuBtn[] = [
  {
    label: $T('player.editGroupMember'),
    icon: 'group',
    onClick: () => {
      $q.dialog({
        component: GroupMemberDialog,
        componentProps: {
          players: prop.group.players,
        } as GroupMembersProp,
      }).onOk((p: GroupMemberReturns) => {
        // グループメンバーの更新
        playerStore.updateGroup(prop.groupId, (g) => {
          p.addPlayers.forEach((pId) => {
            if (!g.players.includes(pId)) {
              g.players.push(pId);
            }
          });
          p.delPlayers.forEach((pId) => {
            const index = g.players.indexOf(pId);
            if (index !== -1) {
              g.players.splice(index, 1);
            }
          });
          return g;
        });
      });
    },
  },
  {
    label: $T('player.renameGroup'),
    icon: 'edit',
    onClick: () => {
      editableName.value = true;
    },
  },
  {
    label: $T('player.changeGroupColor'),
    icon: 'palette',
    onClick: () => (colorPickerOpened.value = true),
    nestedItem: GroupColorPicker,
    nestedProps: {
      groupColor: prop.group.color,
      changeColor: changeColor,
      self: 'top left',
      anchor: 'top right',
      offset: [5, 0],
    },
  },
  {
    label: $T('player.deleteGroup.title'),
    icon: 'close',
    color: 'negative',
    onClick: () => {
      $q.dialog({
        component: DangerDialog,
        componentProps: {
          dialogTitle: $T('player.deleteGroup.title'),
          dialogDesc: $T('player.deleteGroup.desc', {
            groupname: prop.group.name,
          }),
          okBtnTxt: $T('player.deleteGroup.okBtn'),
        } as dangerDialogProp,
      }).onOk(() => playerStore.removeGroup(prop.groupId));
    },
  },
];

function changeColor(colorCode: string) {
  playerStore.updateGroup(prop.groupId, (g) => {
    g.color = colorCode;
    return g;
  });
}

function selectGroupMembers() {
  playerStore.selectGroup(prop.group.name);
}

/**
 * 入力グループ名のバリデーション
 */
function validateGroupName(groupName: string) {
  // 登録されたすべてのグループ名一覧を取得
  const groupNames = new Set(
    values(sysStore.systemSettings.player.groups).map((g) => g.name)
  );
  // 自分以外のグループ名一覧に更新
  groupNames.delete(prop.group.name);
  const isError = groupName === '' || groupNames.has(groupName);

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
    class="q-px-none q-py-xs"
  >
    <div class="cropped-image-container">
      <q-btn
        flat
        dense
        @click.stop
        class="avaterImg cropped-image absolute-left"
      >
        <div class="fit" style="min-width: 1rem">
          <q-img
            :src="assets.png[`${getColorLabel(label2code, group.color)}_wool`]"
            class="avaterImg fit"
          />
        </div>
        <GroupColorPicker
          :group-color="group.color"
          :change-color="changeColor"
          :offset="[0, 5]"
        />
      </q-btn>
    </div>

    <q-item-section class="q-px-sm">
      <EditableText
        v-model:name="groupName"
        v-model:is-edit="editableName"
        :validater="(val) => validateGroupName(val) || validateMessage(val)"
        :auto-focus="autoFocus"
        class="col"
      />

      <div class="row">
        <div class="row q-gutter-x-sm player-icons-container col">
          <div
            v-for="pId in group.players"
            :key="pId"
            class="player-icon-wrapper"
          >
            <LoadPlayerHead :pid="pId" size="1.2rem" />
          </div>
        </div>
        <q-btn outline dense icon="more_horiz" class="q-py-none" @click.stop>
          <q-menu self="top left" anchor="top right" :offset="[5, 0]">
            <q-list>
              <q-item
                v-for="item of menuBtns"
                :key="item.icon"
                clickable
                v-close-popup="item.nestedItem === void 0"
                @click.stop="item.onClick"
              >
                <q-item-section avatar>
                  <q-icon :color="item.color" :name="item.icon" />
                </q-item-section>
                <q-item-section :class="`text-${item.color}`">
                  {{ item.label }}
                </q-item-section>

                <q-item-section v-if="item.nestedItem" side>
                  <q-icon name="keyboard_arrow_right" />
                </q-item-section>

                <component
                  v-if="item.nestedItem"
                  :is="item.nestedItem"
                  v-bind="item.nestedProps"
                />
              </q-item>
            </q-list>
          </q-menu>
          <SsTooltip
            :name="$T('player.groupSettings')"
            self="top middle"
            anchor="bottom middle"
            :offset="[0, 0]"
          />
        </q-btn>
      </div>
    </q-item-section>
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
  padding: 0;
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
    black calc(100% - 2rem),
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
