import { MessageSchema } from 'src/boot/i18n';

export const enWelcome: MessageSchema['welcome'] = {
  welcome: 'Welcome to ServerStarter2!',
  lang: 'Language',
  term: 'Terms of Use',
  termDesc:
    "\
    ServerStarter2's terms of Use can be viewed at {0}.\n\
    Please read before use.",
  link: 'homepage',
  url: 'https://civiltt.github.io/ServerStarter/credit',
  agreeTerm: 'Agree to the term of use of ServerStarter2',
  start: 'Start!',
};
