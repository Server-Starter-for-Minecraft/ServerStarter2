import { z } from 'zod';

export const PlayerUUID = z.string().brand('PlayerUUID');
export type PlayerUUID = z.infer<typeof PlayerUUID>;

export const PlayerName = z.string().brand('PlayerName');
export type PlayerName = z.infer<typeof PlayerName>;

export const Player = z.object({
  uuid: PlayerUUID,
  name: PlayerName,
});
export type Player = z.infer<typeof Player>;

export const OpLevel = z
  .union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
  .brand('OpLevel');
export type OpLevel = z.infer<typeof OpLevel>;
