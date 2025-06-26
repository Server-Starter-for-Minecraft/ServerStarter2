<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { toEntries } from 'app/src-public/scripts/obj/obj';
import { PlayerUUID, UUID } from 'app/src-electron/schema/brands';
import { PlayerGroup } from 'app/src-electron/schema/player';
import { assets } from 'src/assets/assets';
import { useSystemStore } from 'src/stores/SystemStore';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';
import PlayerIcon from '../../utils/PlayerIcon.vue';
import EditableText from './parts/EditableText.vue';
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
    class="q-px-none"
  >
    <div class="cropped-image-container">
      <q-img
        :src="assets.png['white_wool']"
        class="avaterImg cropped-image absolute-left"
      />
    </div>

    <q-item-section class="q-px-sm">
      <div class="row">
        <EditableText
          v-model="groupName"
          :validater="(val) => validateGroupName(val) || validateMessage(val)"
          :auto-focus="autoFocus"
          class="col"
        />
        <q-btn outline dense icon="more_horiz" class="q-py-none" @click.stop>
          <q-menu auto-close>
            <q-list>
              <q-item clickable>
                <q-item-section>New tab</q-item-section>
              </q-item>
              <q-item clickable>
                <q-item-section>New incognito tab</q-item-section>
              </q-item>
              <!-- TODO: 以下の機能を追加 -->
              <!-- １．メンバーの追加 -->
              <!-- ２．グループ名の変更 -->
              <!-- ３．グループカラーの変更 -->
              <!-- ４．グループの削除 -->
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
