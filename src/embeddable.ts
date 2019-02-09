import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
import { Model, Urd } from '@urd/core';

export function applyEmbeddable(m: Model, editor: monaco.editor.IStandaloneCodeEditor) {
  const { Embeddable } = monaco.languages.typescript as any;

  Embeddable.setup('userDeclaration');

  const patterns = Urd.makePatterns(m);
  Embeddable.setMakeModelContent((model: monaco.editor.IReadOnlyModel) => {
    let text = model.getValue();
    let inside = false;
    let result = [];
    let n = 0;

    const paths = ['__root__'];
    for (const line of text.split('\n')) {
      const match = Urd.matchBlock(line);
      if (match.starting) {
        const prop = match.prop;
        const path = paths.join('.');
        const evalPattern = patterns.find(p => p.id === prop && p.path === path);
        if (evalPattern && (match.isEval || evalPattern.type === 'code')) {
          inside = true;
          Embeddable.startBlock(n);
          const returnType =
            {
              code: 'any',
              list: 'string[]',
              text: 'string',
              structure: 'Object'
            }[evalPattern.type] || evalPattern.type;
          const contextType = evalPattern.context || '{}';
          const delimiter = `(function ${prop}(context: ${contextType}): ${returnType} {`;
          const extraChar = Embeddable.registerReplace(line, delimiter);
          n += extraChar;
          result.push(delimiter);
        } else {
          result.push(line.replace(/./gi, ' '));
        }
        paths.push(prop);
      } else if (match.ending) {
        if (inside) {
          inside = false;
          const delimiter = '});';
          const extraChar = Embeddable.registerReplace(line, delimiter);
          n += extraChar;
          Embeddable.endBlock(n);
          result.push(delimiter);
        } else {
          result.push(line.replace(/./gi, ' '));
        }
        paths.pop();
      } else if (inside) {
        result.push(line);
      } else {
        result.push(line.replace(/./gi, ' '));
      }
      n += line.length + 1;
    }
    return result.join('\n');
  });

  Embeddable.setIsInsideBlock(function(model: monaco.editor.IReadOnlyModel, offset: number, position: monaco.Position) {
    const text = model.getValue();
    let inside = false;
    let ln = 1;
    const paths = ['__root__'];
    for (const line of text.split('\n')) {
      const match = Urd.matchBlock(line);
      if (match.starting) {
        const prop = match.prop;
        const path = paths.join('.');
        const pattern = patterns.find(p => p.id === prop && p.path === path);
        if (match.isEval || (pattern && pattern.type === 'code')) {
          inside = true;
        }
      } else if (match.ending) {
        inside = false;
      }
      if (inside && ln === position.lineNumber) {
        return true;
      }
      ln++;
      if (ln > position.lineNumber) break;
    }
    return false;
  });
}
