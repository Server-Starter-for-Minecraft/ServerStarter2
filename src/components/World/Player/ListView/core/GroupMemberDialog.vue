<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { isValid } from 'app/src-public/scripts/error';
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { Player } from 'app/src-electron/schema/player';
import SsInput from 'src/components/util/base/ssInput.vue';
import BaseDialogCard from 'src/components/util/baseDialog/baseDialogCard.vue';
import PlayerHeadAvatar from 'src/components/util/PlayerHeadAvatar.vue';
import SearchResultCard from 'src/components/util/SearchResultCard.vue';
import { GroupMemberReturns, GroupMembersProp } from './iGroupMember';

const prop = defineProps<GroupMembersProp>();
defineEmits({ ...useDialogPluginComponent.emitsObject });
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

// 本ダイアログで追加・削除の操作がされたプレイヤー一覧
// 操作を記録することで，playerStore.updateGroup()の呼び出しを一度にまとめて行う
const addPlayers = ref(new Set<PlayerUUID>());
const delPlayers = ref(new Set<PlayerUUID>());

// 取得済みのプレイヤー情報（UUID -> Player）
const loadedPlayers = ref(new Map<PlayerUUID, Player>());

// 追加・削除の操作を反映した現在のメンバー一覧
// 取得済みならPlayer，取得中ならUUIDのみを保持する
const players = computed<(Player | PlayerUUID)[]>(() => {
  const uuids = new Set(prop.players);
  addPlayers.value.forEach((p) => uuids.add(p));
  delPlayers.value.forEach((p) => uuids.delete(p));
  return Array.from(uuids).map((uuid) => loadedPlayers.value.get(uuid) ?? uuid);
});

// プレイヤーの検索名称
const inputResearchName = ref('');

/**
 * UUIDからプレイヤー情報を取得し，取得済み一覧に反映する
 */
async function loadPlayer(uuid: PlayerUUID) {
  const player = await window.API.invokeGetPlayer(uuid, 'uuid');
  if (isValid(player)) {
    loadedPlayers.value.set(uuid, player);
  }
}

/**
 * グループメンバーの追加
 *
 * もともと存在したメンバーを一度削除してから追加した場合，単純に追加した場合で処理を分岐
 */
function onAddedPlayer(uuid: PlayerUUID) {
  if (delPlayers.value.has(uuid)) {
    delPlayers.value.delete(uuid);
  } else {
    addPlayers.value.add(uuid);
  }
}

/**
 * グループメンバーの削除
 *
 * もともと存在しないメンバーを一度追加してから削除した場合，単純に削除した場合で処理を分岐
 */
function onRemovedPlayer(uuid: PlayerUUID) {
  if (addPlayers.value.has(uuid)) {
    addPlayers.value.delete(uuid);
  } else {
    delPlayers.value.add(uuid);
  }
}

/**
 * 検索結果に対するプレイヤーの登録処理
 *
 * TODO: 本当はPlayerデータを親が管理して，親からデータを子に渡すようにすることで，API呼び出しをまとめる
 * Group内のPlayerデータはGroupCard / List が管理して，編集画面や子要素は親要素からデータを受けるようにしたい
 */
function registerPlayer(player: Player) {
  loadedPlayers.value.set(player.uuid, player);
  onAddedPlayer(player.uuid);
  // 検索欄をリセット
  inputResearchName.value = '';
}

/**
 * 検索結果に表示するプレイヤーのフィルタリング
 *
 * 引数に指定されたプレイヤーIDがすでにグループメンバーに含まれている場合はFalseを返して非表示とする
 */
function filterPlayer(pId?: PlayerUUID) {
  return !pId || !prop.players.includes(pId);
}

// イベント類
onMounted(() => prop.players.forEach(loadPlayer));

function onOkClick() {
  onDialogOK({
    addPlayers: new Set(addPlayers.value),
    delPlayers: new Set(delPlayers.value),
  } as GroupMemberReturns);
}
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <BaseDialogCard
      :title="$t('player.groupMemberDialog.title')"
      :ok-btn-txt="$t('player.groupMemberDialog.okBtn')"
      @close="onDialogCancel"
      @ok-click="onOkClick"
      style="width: 25rem; max-width: 100%"
    >
      <span class="text-caption">
        {{ $t('player.groupMemberDialog.searchTitle') }}
      </span>
      <SsInput
        v-model="inputResearchName"
        dense
        :placeholder="$t('player.search')"
        :debounce="200"
        class="q-pb-md q-pt-xs col"
      />

      <div v-show="inputResearchName !== ''" class="q-pb-md">
        <span class="text-caption">
          {{ $t('owner.searchResult') }}
        </span>
        <SearchResultCard
          v-model="inputResearchName"
          :register-btn-text="$t('owner.registerPlayer')"
          :register-process="registerPlayer"
          :player-filter="filterPlayer"
        />
      </div>

      <span class="text-caption">
        {{ $t('player.groupMemberDialog.memberTitle') }}
      </span>
      <q-list class="q-gutter-y-sm q-py-sm scroll-area">
        <template
          v-for="player in players"
          :key="typeof player === 'string' ? player : player.uuid"
        >
          <q-item v-if="typeof player === 'string'" dense>
            <q-item-section avatar style="min-width: 0">
              <q-skeleton type="QAvatar" size="1.5rem" />
            </q-item-section>
            <q-item-section>
              <q-skeleton type="text" />
            </q-item-section>
            <!-- 取得に失敗したメンバーも UUID から削除できるようにする -->
            <q-item-section side>
              <q-btn
                outline
                dense
                icon="close"
                :label="$t('general.delete')"
                color="negative"
                @click="onRemovedPlayer(player)"
              />
            </q-item-section>
          </q-item>
          <q-item v-else dense>
            <q-item-section avatar style="min-width: 0">
              <PlayerHeadAvatar :player="player" size="1.5rem" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="name text-omit">
                {{ player.name }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn
                outline
                dense
                icon="close"
                :label="$t('general.delete')"
                color="negative"
                @click="onRemovedPlayer(player.uuid)"
              />
            </q-item-section>
          </q-item>
        </template>
      </q-list>
    </BaseDialogCard>
  </q-dialog>
</template>

<style lang="scss" scoped>
.name {
  font-size: 1.1rem;
}

.scroll-area {
  overflow: auto;
  max-height: 50vh;
}
</style>
