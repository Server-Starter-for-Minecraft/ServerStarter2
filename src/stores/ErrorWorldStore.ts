import { defineStore } from 'pinia';
import { keys } from 'app/src-public/scripts/obj/obj';
import { WorldID } from 'app/src-electron/schema/brands';

export const UNKNOWN_VERSION_ERROR_REASON = 'server_type_is_unknown';

export const useErrorWorldStore = defineStore('errorWorldStore', {
  state: () => {
    return {
      errorWorlds: {} as Record<WorldID, Set<string>>,
    };
  },
  actions: {
    /**
     * ワールドをロック（エラー原因は任意の文字列で表現する）
     */
    lock(worldID: WorldID, reasonKey: string) {
      if (!keys(this.errorWorlds).includes(worldID)) {
        this.errorWorlds[worldID] = new Set<string>();
      }
      this.errorWorlds[worldID].add(reasonKey);
    },
    unlock(worldID: WorldID, reasonKey: string) {
      if (keys(this.errorWorlds).includes(worldID)) {
        this.errorWorlds[worldID].delete(reasonKey);
      }
    },
    isError(worldID: WorldID): boolean {
      const errorCounts = this.errorWorlds[worldID]?.size ?? 0;
      return errorCounts > 0;
    },
  },
});
