import { Model, makePaths } from './model';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';

export function makeCodelens(model: Model, editor: monaco.editor.IStandaloneCodeEditor) {
  const data = [];
  const patterns = makePaths(model);

  const code = editor.getValue();
  const lineNumber = editor.getPosition().lineNumber;

  const paths = ['__root__'];
  for (const [ln, line] of Object.entries(code.split('\n'))) {
    if (line.match(/^\s*(.+)\:.+/) || line.match(/^\s*<([^\/].+)\:.+>/) || line.match(/^\s*<([^\/].+)>/)) {
      const prop = RegExp.$1.trim();
      const path = paths.join('.');
      const pattern = patterns.find(p => p.path === path && p.id === prop);
      if (pattern) {
        let title = pattern.type[0].toUpperCase() + pattern.type.substring(1, pattern.type.length);
        if (
          line.match(/^\s*<([^\/].+)\:.+>/) ||
          (line.match(/^\s*<([^\/].+)>/) && !['code', 'list', 'text', 'structure'].includes(pattern.type))
        ) {
          title += ' (evaluated)';
        }
        const commandId = editor.addCommand(
          null,
          function() {
            console.log('pattern :', pattern);
            console.log('ln :', ln);
          },
          ''
        );
        data.push({
          range: {
            startLineNumber: Number(ln) + 1,
            startColumn: 1,
            endLineNumber: Number(ln) + 2,
            endColumn: 1
          },
          id: `codelens_${path}.${prop}`,
          command: {
            id: commandId,
            title
          }
        });
      }
    }
    if (line.match(/^\s*<([^\/].+)\:.+>/) || line.match(/^\s*<([^\/].+)>/)) {
      paths.push(RegExp.$1);
    } else if (line.match(/^\s*<\/(.+)\:.+>/) || line.match(/^\s*<\/(.+)>/)) {
      paths.pop();
    }
  }

  return data;
}
