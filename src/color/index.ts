import { setCssVar } from 'quasar';
import { colors, ColorThemes } from './colors';
import { keys } from 'app/src-public/scripts/obj/obj';

export function setColor(isDark: boolean, isDiversity: boolean) {
  const lightMode = isDark ? 'dark' : 'light';
  const diversityMode = isDiversity ? '-diversity' : '';
  setCss(`${lightMode}${diversityMode}`);
}

function setCss(theme: ColorThemes) {
  keys(colors[theme]).forEach((k) => setCssVar(k, colors[theme][k]));
}
