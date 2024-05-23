import { NewType } from './newtype';

export type PlayerUUID = NewType<string, 'PlayerUUID'>;
export type PlayerName = NewType<string, 'PlayerName'>;

export interface Player {
  uuid: PlayerUUID;
  name: PlayerName;
}

export type OpLevel = NewType<0 | 1 | 2 | 3 | 4, 'OpLevel'>;
