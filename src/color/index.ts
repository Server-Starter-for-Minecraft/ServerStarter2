import { setCssVar } from 'quasar';
import { keys } from 'src/scripts/obj';
import { colors, ColorThemes } from './colors';

export function setColor(isDark: boolean, isDiversity: boolean) {
  const lightMode = isDark ? 'dark' : 'light';
  const diversityMode = isDiversity ? '-diversity' : '';
  setCss(`${lightMode}${diversityMode}`);
}

function setCss(theme: ColorThemes) {
  keys(colors[theme]).forEach((k) => setCssVar(k, colors[theme][k]));
}
