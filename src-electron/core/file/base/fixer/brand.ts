import {
  PlayerUUID,
  RemoteWorldName,
  Timestamp,
  UUID,
} from 'app/src-electron/schema/brands';
import { Fixer, fail } from './fixer';
import { fixNumber, fixString } from './primitive';

export const fixTimestamp = fixNumber as Fixer<Timestamp, true>;

const UUIDRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export const fixUUID = fixString.map((x, p) => {
  const upper = x.toUpperCase();
  return upper.match(UUIDRegex) ? upper : fail([p]);
}) as Fixer<UUID, true>;

export const fixPlayerUUID = fixUUID as Fixer<PlayerUUID, true>;

export const fixRemoteWorldName = fixString as Fixer<RemoteWorldName, true>;
