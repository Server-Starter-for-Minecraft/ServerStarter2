import { setCssVar } from 'quasar';
import { keys } from 'src/scripts/obj';
import { colors, ColorThemes } from './colors';

export function setColor(isDark: boolean, isDiversity: boolean) {
  const pattern = Number(isDark) + Number(isDiversity) * 2;

  switch (pattern) {
    case 0:
      setCss('light');
      break;
    case 1:
      setCss('dark');
      break;
    case 2:
      setCss('light-diversity');
      break;
    case 3:
      setCss('dark-diversity');
      break;
    default:
      break;
  }
}

function setCss(theme: ColorThemes) {
  keys(colors[theme]).forEach((k) => setCssVar(k, colors[theme][k]));
}
