export type StringServerProperty = {
  type: 'string';
  value: string;
  enum?: string[];
};

export type BooleanServerProperty = {
  type: 'boolean';
  value: boolean;
};

export type NumberServerProperty = {
  type: 'number';
  value: number;

  /** value % step == 0 */
  step?: number;

  /** min <= value <= max */
  min?: number;
  max?: number;
};

export type ServerProperty =
  | StringServerProperty
  | BooleanServerProperty
  | NumberServerProperty;

export type ServerProperties = {
  [key in string]: ServerProperty;
};

export type ServerPropertiesMap = {
  [key in string]: string | number | boolean;
};
