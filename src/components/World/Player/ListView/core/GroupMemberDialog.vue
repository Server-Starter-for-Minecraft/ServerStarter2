<script setup lang="ts">
import { onMounted, ref, watchEffect } from 'vue';
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
const loadedPlayers = ref<Player[]>([]);
const loadingPlayers = ref(false);

// プレイヤーの検索名称
const inputResearchName = ref('');

const getPlayers = async () => {
  // 追加・削除の操作をUUID一覧に反映
  const targetPlayerUUIDs = new Set(prop.players);
  addPlayers.value.forEach((p) => targetPlayerUUIDs.add(p));
  delPlayers.value.forEach((p) => targetPlayerUUIDs.delete(p));

  // UUIDからプレイヤー情報を取得
  const allPlayers = await Promise.all(
    Array.from(targetPlayerUUIDs).map((uuid) =>
      window.API.invokeGetPlayer(uuid, 'uuid')
    )
  );

  return allPlayers.filter(isValid);
};

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
 */
function registerPlayer(player: Player) {
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
onMounted(async () => (loadedPlayers.value = await getPlayers()));
watchEffect(async () => {
  loadingPlayers.value = true;
  loadedPlayers.value = await getPlayers();
  loadingPlayers.value = false;
});
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <BaseDialogCard
      :title="$t('player.groupMemberDialog.title')"
      :ok-btn-txt="$t('player.groupMemberDialog.okBtn')"
      @close="onDialogCancel"
      @ok-click="() => onDialogOK({ addPlayers, delPlayers } as GroupMemberReturns)"
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
        <div v-if="loadingPlayers">
          <q-spinner color="primary" size="2em" />
          <span class="q-ml-sm">{{
            $t('player.groupMemberDialog.loadingMembers')
          }}</span>
        </div>
        <q-item v-else v-for="player in loadedPlayers" :key="player.uuid" dense>
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
