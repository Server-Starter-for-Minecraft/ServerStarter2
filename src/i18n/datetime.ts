import { DefineDateTimeFormat } from 'vue-i18n';

const jaDatetimeFormats: DefineDateTimeFormat = {
  date: {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  },
  dateTime: {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
  },
};

const enUSDatetimeFormats: DefineDateTimeFormat = {
  date: {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  },
  dateTime: {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    weekday: 'long',
    hour: 'numeric',
    minute: 'numeric',
  },
};

export const datetimeFormats = {
  ja: jaDatetimeFormats,
  'en-US': enUSDatetimeFormats,
};
