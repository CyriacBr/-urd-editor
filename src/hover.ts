import { Model, Urd} from '@urd/core';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';

export function makeHoverMessage(model: Model, position: monaco.Position, editor: monaco.editor.IStandaloneCodeEditor) {
  const patterns = Urd.makePatterns(model);

  const code = editor.getValue();

  const paths = ['__root__'];
  for (const [ln, line] of Object.entries(code.split('\n'))) {
    const match = Urd.matchBlock(line);
    if (match.starting || match.inline) {
      const prop = match.prop;
      const path = paths.join('.');
      const pattern = patterns.find(p => p.path === path && p.id === prop);
      if (pattern && position.lineNumber === Number(ln) + 1) {
        const pathId = Array.from(paths)
          .concat(pattern.id)
          .join('.')
          .replace('__root__.', '');
        let title;
        if (match.isEval || pattern.type === 'code') {
          title = `${pathId} **(evaluated)**`;
        } else {
          title = pathId;
        }
        let desc = pattern.desc || '(No description available)';
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
    if (match.starting) {
      paths.push(match.prop);
    } else if (match.ending) {
      paths.pop();
    }
  }

  return {};
}
