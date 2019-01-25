import { Model, makePaths } from './model';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';

export function makeHoverMessage(model: Model, position: monaco.Position, editor: monaco.editor.IStandaloneCodeEditor) {
  const patterns = makePaths(model);

  const code = editor.getValue();

  const paths = ['__root__'];
  for (const [ln, line] of Object.entries(code.split('\n'))) {
    if (line.match(/^\s*(.+)\:.+/) || line.match(/^\s*<([^\/].+)\:.+>/) || line.match(/^\s*<([^\/].+)>/)) {
      const prop = RegExp.$1.trim();
      const path = paths.join('.');
      const pattern = patterns.find(p => p.path === path && p.id === prop);
      if (pattern && position.lineNumber === Number(ln) + 1) {
        let title;
        if (
          line.match(/^\s*<([^\/].+)\:.+>/) ||
          (line.match(/^\s*<([^\/].+)>/) && !['code', 'list', 'text', 'structure'].includes(pattern.type))
        ) {
          title = `&#x1F538; ${pattern.id} **(evaluated)**`;
        } else {
          title = pattern.id;
        }
        let desc = pattern.desc || '(No description)';
        return {
          range: new monaco.Range(Number(ln) + 1, 1, Number(ln) + 2, 1),
          contents: [
            { value: title },
            { value: desc },
            { value: pattern.type[0].toUpperCase() + pattern.type.substring(1, pattern.type.length) }
          ]
        };
      }
    }
    if (line.match(/^\s*<([^\/].+)\:.+>/) || line.match(/^\s*<([^\/].+)>/)) {
      paths.push(RegExp.$1);
    } else if (line.match(/^\s*<\/(.+)\:.+>/) || line.match(/^\s*<\/(.+)>/)) {
      paths.pop();
    }
  }

  return {};
}
