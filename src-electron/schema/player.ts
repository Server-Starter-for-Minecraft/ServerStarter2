export type Player = {
  name: string;
  uuid: string;
};

export type PlayerGroup = {
  name: string;
  players: Player[];
};
