import { z } from 'zod';

export const UnixMillisec = z.number().brand('UnixMillisec');
export type UnixMillisec = z.infer<typeof UnixMillisec>;
