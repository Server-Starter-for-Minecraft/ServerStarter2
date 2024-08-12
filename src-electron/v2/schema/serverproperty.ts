import { z } from 'zod';

export const StringServerPropertyAnnotation = z.object({
  type: z.enum(['string']),
  default: z.string(),
  enum: z.string().array().optional(),
});
export type StringServerPropertyAnnotation = z.infer<
  typeof StringServerPropertyAnnotation
>;

export const BooleanServerPropertyAnnotation = z.object({
  type: z.enum(['boolean']),
  default: z.boolean(),
});
export type BooleanServerPropertyAnnotation = z.infer<
  typeof BooleanServerPropertyAnnotation
>;

export const NumberServerPropertyAnnotation = z.object({
  type: z.enum(['number']),
  default: z.number(),

  /** value % step == 0 */
  step: z.number().optional(),

  /** min <= value <= max */
  min: z.number().optional(),
  max: z.number().optional(),
});
export type NumberServerPropertyAnnotation = z.infer<
  typeof NumberServerPropertyAnnotation
>;

export const ServerPropertyAnnotation = StringServerPropertyAnnotation.or(
  BooleanServerPropertyAnnotation.or(NumberServerPropertyAnnotation)
);
export type ServerPropertyAnnotation = z.infer<typeof ServerPropertyAnnotation>;

/** サーバープロパティのアノテーション */
export const ServerPropertiesAnnotation = z.record(ServerPropertyAnnotation);
export type ServerPropertiesAnnotation = z.infer<
  typeof ServerPropertiesAnnotation
>;

/** サーバープロパティのデータ */
export const ServerProperties = z.record(
  z.string().or(z.number().or(z.boolean()))
);
export type ServerProperties = z.infer<typeof ServerProperties>;
