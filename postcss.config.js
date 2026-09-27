// https://github.com/michael-ciniawsky/postcss-load-config
import autoprefixer from 'autoprefixer';

export default {
  plugins: [
    // https://github.com/postcss/autoprefixer
    autoprefixer({
      overrideBrowserslist: ['last 4 Chrome versions'],
    }),
  ],
};
