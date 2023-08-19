import { boot } from 'quasar/wrappers';
import { createI18n } from 'vue-i18n';

import messages from 'src/i18n';
import dateTimeFormats from 'src/i18n/datetime';

export type MessageLanguages = keyof typeof messages;
// Type-define 'en-US' as the master schema for the resource
export type MessageSchema = (typeof messages)['ja'];

// See https://vue-i18n.intlify.dev/guide/advanced/typescript.html#global-resource-schema-type-definition
/* eslint-disable @typescript-eslint/no-empty-interface */
declare module 'vue-i18n' {
  // define the locale messages schema
  export interface DefineLocaleMessage extends MessageSchema {}

  // define the datetime format schema
  export interface DefineDateTimeFormat {}

  // define the number format schema
  export interface DefineNumberFormat {}
}
/* eslint-enable @typescript-eslint/no-empty-interface */

export default boot(({ app }) => {
  const i18n = createI18n({
    locale: 'ja',
    legacy: false,
    messages,
    datetimeFormats: {
      'ja': {
        'date': {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        },
        'dateTime': {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          weekday: 'short',
          hour: 'numeric',
          minute: 'numeric',
        }
      },
      'en-US': {
        'date': {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        },
        'dateTime': {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          weekday: 'long',
          hour: 'numeric',
          minute: 'numeric',
        }
      },
    }
  });

  // Set i18n instance on app
  app.use(i18n);
});
