export type StringServerPropertyAnnotation = {
  type: 'string';
  default: string;
  enum?: string[];
};

export type BooleanServerPropertyAnnotation = {
  type: 'boolean';
  default: boolean;
};

export type NumberServerPropertyAnnotation = {
  type: 'number';
  default: number;

  /** value % step == 0 */
  step?: number;

  /** min <= value <= max */
  min?: number;
  max?: number;
};

export type ServerPropertyAnnotation =
  | StringServerPropertyAnnotation
  | BooleanServerPropertyAnnotation
  | NumberServerPropertyAnnotation;

/** サーバープロパティのアノテーション */
export type ServerPropertiesAnnotation = {
  [key in string]: ServerPropertyAnnotation;
};

/** サーバープロパティのデータ */
export type ServerProperties = {
  [key in string]: string | number | boolean;
};
