import { Model, makePaths } from './model';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';

export function makeCompletions(mo: monaco.editor.ITextModel, position: monaco.Position, model: Model): any[] {
  const textUntilPosition = mo.getValueInRange({
    startLineNumber: 1,
    startColumn: 1,
    endLineNumber: position.lineNumber,
    endColumn: position.column
  });
  const suggestions: any[] = [];

  const patterns = makePaths(model);
  const paths = ['__root__'];
  for (const line of textUntilPosition.split('\n')) {
    if (line.match(/^\s*<([^\/].+)\:.+>/) || line.match(/^\s*<([^\/].+)>/)) {
      paths.push(RegExp.$1);
    } else if (line.match(/^\s*<\/(.+)\:.+>/) || line.match(/^\s*<\/(.+)>/)) {
      paths.pop();
    }
  }
  const path = paths.join('.');
  patterns
    .filter(p => p.path === path)
    .forEach(p => {
      const documentation = `${path.replace(/__root__.?/, '')}: ${p.desc}`;
      let insertText = '';
      if (['code', 'structure', 'text', 'type'].includes(p.type)) {
        insertText = `<${p.id}>\n${'$0'}\n</${p.id}>`;
      } else {
        insertText = `${p.id}: `;
      }
      if (!suggestions.find(s => s.label === p.id)) {
        suggestions.push({
          label: p.id,
          kind: monaco.languages.CompletionItemKind.Function,
          documentation,
          insertText,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: p.type
        });
      }
    });

  console.log('suggestions :', suggestions);
  return suggestions;
}
