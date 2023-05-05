import { defineStore } from 'pinia';
import { OpLevel, PlayerGroupSetting, PlayerSetting } from 'app/src-electron/schema/player';
import { ServerProperties, ServerProperty } from 'app/src-electron/schema/serverproperty';
import { WorldEdited } from 'app/src-electron/schema/world';
import { deepCopy } from 'src/scripts/deepCopy';

export type PropertyRow = { name: string; value: ServerProperty, useDefault: boolean };
export type PlayerRow = { name: string; uuid: string; op: OpLevel | 'unset'; white_list: boolean; group: boolean };
export type GroupRow = { name: string; uuid: string; op: OpLevel | 'unset'; white_list: boolean; };

export const useWorldEditStore = defineStore('worldEditStore', {
  state: () => {
    return {
      worldIndex: -1,
      world: {} as WorldEdited,
      title: '',
      saveFunc: () => {
        return;
      },
      propertyRows: [] as PropertyRow[],
      playerRows: [] as PlayerRow[],
      groupRows: [] as GroupRow[],
    };
  },
  actions: {
    /**
     * World Editページを起動するにあたり必要なデータの受け渡し
     */
    async setEditer(
      world: WorldEdited,
      saveFunc: () => void,
      { worldIndex = -1, title = 'ワールド編集' }
    ) {
      this.world = world;
      this.worldIndex = worldIndex;
      this.title = title;
      this.saveFunc = saveFunc;

      // set rows for q-table
      this.propertyRows = await getPropertyRows(world)
      this.playerRows = getPlayerRows(world)
      this.groupRows = getGroupRows(world)
    },
    /**
     * 編集済みのWorldEditedオブジェクトを取得する
     */
    getEditedWorld(): WorldEdited {
      const returnWorld = deepCopy(this.world)

      // 分散して定義した項目を統合
      returnWorld.properties = getEditedProperties(this.propertyRows)
      returnWorld.authority.players = getPlayers(this.playerRows)
      returnWorld.authority.groups = getGroups(this.groupRows)

      return returnWorld
    }
  },
});

async function getPropertyRows(world: WorldEdited): Promise<PropertyRow[]> {
  const settings = await window.API.invokeGetDefaultSettings()
  return Object.entries(settings.properties)
    .map(([k, v]) => {
      return {
        name: k,
        value: world.properties?.[k] ?? v,
        useDefault: true
      }
    })
}

function getPlayerRows(world: WorldEdited): PlayerRow[] {
  return world.authority.players.map(p => {
    return {
      name: p.name,
      uuid: p.uuid,
      op: p.op?.level ?? 'unset',
      white_list: p.whitelist,
      group: false
    }
  })
}

function getGroupRows(world: WorldEdited): GroupRow[] {
  return world.authority.groups.map(g => {
    return {
      name: g.name,
      uuid: g.uuid,
      op: g.op?.level ?? 'unset',
      white_list: g.whitelist
    }
  })
}

function getEditedProperties(propertyRows: PropertyRow[]): ServerProperties {
  const filteredRow = propertyRows.filter(row => !row.useDefault)
  return Object.fromEntries(filteredRow.map(row => [row.name, row.value]))
}

function getPlayers(playerRows: PlayerRow[]): PlayerSetting[] {
  function setOP(op: OpLevel | 'unset') {
    if (op === 'unset') return undefined
    return {
      level: op,
      bypassesPlayerLimit: false
    }
  }

  return playerRows.map(row => {
    return {
      name: row.name,
      uuid: row.uuid,
      op: setOP(row.op),
      whitelist: row.white_list
    }
  })
}

function getGroups(groupRows: GroupRow[]): PlayerGroupSetting[] {
  function setOP(op: OpLevel | 'unset') {
    if (op === 'unset') return undefined
    return {
      level: op,
      bypassesPlayerLimit: false
    }
  }

  return groupRows.map(row => {
    return {
      name: row.name,
      uuid: row.uuid,
      op: setOP(row.op),
      whitelist: row.white_list
    }
  })
}