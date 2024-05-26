<script setup lang="ts">
import { ref } from 'vue';
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { PlayerGroup } from 'app/src-electron/schema/player';
import { deepcopy } from 'src/scripts/deepcopy';
import { keys, values } from 'src/scripts/obj';
import { assets } from 'src/assets/assets';
import { useSystemStore } from 'src/stores/SystemStore';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';
import PlayerIcon from '../../utils/PlayerIcon.vue';

interface Prop {
  group: PlayerGroup;
}
const prop = defineProps<Prop>();

const sysStore = useSystemStore();
const playerStore = usePlayerStore();
const expanded = ref(false);

const label2code = sysStore.staticResouces.minecraftColors;

const getColorLabel = (color: string) => {
  const oldKey = keys(label2code)[values(label2code).indexOf(color)];

  // TODO: 変換コードをバックエンドに移築
  const old2newKey = {
    dark_red: 'red',
    red: 'pink',
    gold: 'orange',
    yellow: 'yellow',
    dark_green: 'green',
    green: 'lime',
    aqua: 'light_blue',
    dark_aqua: 'cyan',
    dark_blue: 'blue',
    blue: 'brown',
    light_purple: 'magenta',
    dark_purple: 'purple',
    white: 'white',
    gray: 'light_gray',
    dark_gray: 'gray',
    black: 'black',
  } as const;

  return old2newKey[oldKey];
};

function addMember(uuid: PlayerUUID) {
  const members =
    sysStore.systemSettings.player.groups[prop.group.name].players;
  if (members.indexOf(uuid) === -1) {
    members.push(uuid);
  }
  playerStore.unFocus();
}

function selectGroupMembers() {
  const group = prop.group;
  playerStore.focusCards = new Set(group.players);
  playerStore.selectedGroup = deepcopy(Object.assign(group, { isNew: false }));
  playerStore.selectedGroupName = group.name;
}

function changeColor(colorCode: string) {
  sysStore.systemSettings.player.groups[prop.group.name].color = colorCode;
}

function removeMember(uuid: PlayerUUID) {
  const members =
    sysStore.systemSettings.player.groups[prop.group.name].players;
  members.splice(members.indexOf(uuid), 1);
}

function removeGroup() {
  delete sysStore.systemSettings.player.groups[prop.group.name];
}
</script>

<template>
  <q-expansion-item v-model="expanded" @click.stop="selectGroupMembers()">
    <template #header>
      <div class="row full-width q-pr-md">
        <div class="row q-gutter-md items-center col">
          <q-btn-dropdown flat dense>
            <template #label>
              <q-avatar square size="2rem">
                <q-img
                  :src="assets.png[`${getColorLabel(group.color)}_wool`]"
                  class="avaterImg"
                />
              </q-avatar>
            </template>

            <div
              class="q-gutter-sm row q-pa-xs"
              style="width: 12rem; margin: 0 auto"
            >
              <template
                v-for="colorLabel in keys(label2code)"
                :key="colorLabel"
              >
                <q-btn
                  v-close-popup
                  dense
                  flat
                  class="q-ma-none col-3"
                  @click="changeColor(label2code[colorLabel])"
                >
                  <q-avatar square size="2rem">
                    <q-img
                      :src="
                        assets.png[
                          `${getColorLabel(label2code[colorLabel])}_dye`
                        ]
                      "
                      class="avaterImg"
                    />
                  </q-avatar>
                  <SsTooltip
                    :name="$t(`player.color.${colorLabel}`)"
                    anchor="bottom middle"
                    self="center middle"
                  />
                </q-btn>
              </template>
            </div>
          </q-btn-dropdown>

          <span style="font-size: 1.2rem">{{ group.name }}</span>
        </div>
        <div v-if="expanded" class="row q-gutter-md">
          <SsBtn
            free-width
            :disable="playerStore.focusCards.size === 0"
            label="選択中のプレイヤーをグループに追加"
            color="primary"
            @click.stop="playerStore.focusCards.forEach(addMember)"
          />
          <SsBtn
            free-width
            label="グループを削除"
            color="negative"
            @click.stop="removeGroup"
          />
        </div>
      </div>
    </template>

    <div class="q-pl-xl q-py-md row q-gutter-md">
      <template v-for="pId in group.players" :key="pId">
        <PlayerIcon :uuid="pId" :negative-btn-clicked="removeMember" />
      </template>
    </div>
  </q-expansion-item>
</template>

<style scoped lang="scss">
.avaterImg {
  position: absolute;
  image-rendering: pixelated;
}
</style>
