import {
  BooleanServerPropertyAnnotation,
  NumberServerPropertyAnnotation,
  ServerProperties,
  ServerPropertiesAnnotation,
  ServerPropertyAnnotation,
  StringServerPropertyAnnotation,
} from 'app/src-electron/schema/serverproperty';
import {
  arrayFixer,
  booleanFixer,
  FAIL,
  Fixer,
  literalFixer,
  numberFixer,
  objectFixer,
  optionalFixer,
  recordFixer,
  stringFixer,
  unionFixer,
} from 'app/src-electron/util/detaFixer/fixer';

export const fixStringServerPropertyAnnotation =
  objectFixer<StringServerPropertyAnnotation>(
    {
      type: literalFixer(['string']),
      default: stringFixer(),
      enum: optionalFixer(arrayFixer(stringFixer(), false)),
    },
    false
  );

export const fixBooleanServerPropertyAnnotation =
  objectFixer<BooleanServerPropertyAnnotation>(
    {
      type: literalFixer(['boolean']),
      default: booleanFixer(),
    },
    false
  );

export const fixNumberServerPropertyAnnotation =
  objectFixer<NumberServerPropertyAnnotation>(
    {
      type: literalFixer(['number']),
      default: numberFixer(),

      /** value % step == 0 */
      step: optionalFixer(numberFixer()),

      /** min <= value <= max */
      min: optionalFixer(numberFixer()),
      max: optionalFixer(numberFixer()),
    },
    false
  );

export const fixServerPropertyAnnotation: Fixer<
  ServerPropertyAnnotation | FAIL
> = unionFixer(
  fixStringServerPropertyAnnotation,
  fixBooleanServerPropertyAnnotation,
  fixNumberServerPropertyAnnotation
);

/** サーバープロパティのアノテーション */
export const fixServerPropertiesAnnotation: Fixer<
  ServerPropertiesAnnotation | FAIL
> = recordFixer<string, ServerPropertyAnnotation>(
  fixServerPropertyAnnotation,
  false
);

/** サーバープロパティのデータ */
export const fixServerProperties: Fixer<ServerProperties | FAIL> = recordFixer<
  string,
  string | number | boolean
>(unionFixer(stringFixer(), numberFixer(), booleanFixer()), false);
