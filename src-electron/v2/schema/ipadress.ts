import { z } from 'zod';

export const IpAdress = z.string().brand('IpAdress');
export type IpAdress = z.infer<typeof IpAdress>;
