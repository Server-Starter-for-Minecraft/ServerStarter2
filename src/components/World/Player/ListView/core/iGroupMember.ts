import { PlayerUUID } from "app/src-electron/schema/brands";

export interface GroupMembersProp {
  players: PlayerUUID[];
}

export interface GroupMemberReturns {
  addPlayers: Set<PlayerUUID>;
  delPlayers: Set<PlayerUUID>;
}