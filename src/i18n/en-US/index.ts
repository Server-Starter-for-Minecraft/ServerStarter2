// This is just an example,
// so you can safely delete all default props below
import { MessageSchema } from "src/boot/i18n";

export const enUS: MessageSchema = {
  failed: 'Action failed',
  success: 'Action was successful',
  home: {
    worldname: 'World Name',
    version: 'Version',
    useworld: 'Use existing world',
    settings: 'Opening Settings'
  },
  property: {
    levelseed: 'World Seed Value'
  },
};
