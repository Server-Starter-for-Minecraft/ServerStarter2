import { Player } from "./player";

export type OpLevel = 1 | 2 | 3 | 4;

export type OpPlayer = {
  type: 'player';
  name: string;
  uuid: string;
  level: OpLevel;
};

export type OpGroup = {
  type: 'group';
  name: string;
  level: OpLevel;
};

export type Ops = (Player | OpGroup)[];
