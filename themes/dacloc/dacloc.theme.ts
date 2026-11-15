// The dacloc theme. `astryx experimental theme editor` wrote this file once and never changes it again.
// The checked settings live in dacloc.settings.json and the generated dacloc.settings.ts;
// change them with `astryx experimental theme editor set dacloc ...`. Add your own changes below: they win over the settings.
import {defineTheme} from '@astryxdesign/core/theme';
import {daclocSettings} from './dacloc.settings';

export const daclocTheme = defineTheme({
  extends: daclocSettings,
  name: 'dacloc',
});
