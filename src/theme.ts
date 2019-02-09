import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
import * as OneDark from './OneDark-Pro.json';
import * as Electron from './electron-color-theme.json';

export function defineTheme() {
  const themeRules = [];
  for (const data of Electron.tokenColors) {
    if (!data.scope) {
      themeRules.push({
        ...data.settings
      });
    } else {
      const scopes = Array.isArray(data.scope) ? data.scope : data.scope.split(',');
      for (const scope of scopes) {
        themeRules.push({
          token: scope.trim(),
          ...data.settings
        });
      }
    }
  }
  console.log('themeRules :', themeRules);
  monaco.editor.defineTheme('urd-dark', {
    base: 'vs-dark',
    inherit: true,
    colors: {
      ...Electron.colors
    },
    rules: [
      ...themeRules
      /*{ token: 'operator', foreground: '#89DDF3' },
      { token: 'delimiter', foreground: '#89DDF3' },
      { token: 'my-delimiter', foreground: '#89DDF3', fontStyle: 'bold' },
      { token: 'prop', foreground: '#e06c75', fontStyle: 'bold' },
      // { token: 'tag', foreground: '#e06c75' },
      { token: 'prop-tag', foreground: '#e06c75', fontStyle: 'bold' },
      { token: 'tag-param', foreground: '#d19a66', fontStyle: 'italic' },
      { token: 'number', foreground: '#F78C6A' },
      { token: 'text', fontStyle: 'bold' }*/
    ]
  });
}
