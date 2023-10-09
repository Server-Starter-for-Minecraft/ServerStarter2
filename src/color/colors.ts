type ColorSetting = {
  primary: string
}

export type ColorThemes = 'light' | 'dark' | 'light-diversity' | 'dark-diversity'

type ColorSettings = {
  [key in ColorThemes]: ColorSetting
}

export const colors: ColorSettings = {
  'light': {
    primary: '#1EB000',
  },
  'dark': {
    primary: '#7FFF00'
  },
  'light-diversity': {
    primary: '#0032D4'
  },
  'dark-diversity': {
    primary: '#1E8FFF'
  }
}


// TODO: text-red -> text-negativeに変更する