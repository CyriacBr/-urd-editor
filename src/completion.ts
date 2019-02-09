import { Model, Urd } from '@urd/core';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';

export function makeCompletions(mo: monaco.editor.ITextModel, position: monaco.Position, model: Model): any[] {
  const textUntilPosition = mo.getValueInRange({
    startLineNumber: 1,
    startColumn: 1,
    endLineNumber: position.lineNumber,
    endColumn: position.column
  });
  let suggestions: any[] = [];

  const patterns = Urd.makePatterns(model);
  const paths = Urd.makePaths(textUntilPosition);
  const path = paths.join('.');
  patterns
    .filter(p => p.path === path)
    .forEach(p => {
      const documentation = `${path.replace(/__root__.?/, '')}: ${p.desc}`;
      let insertText = '';
      let command = null;
      if (['code', 'structure', 'text', 'list'].includes(p.type)) {
        insertText = `<${p.id}>\n${'$0'}\n</${p.id}>`;
      } else {
        insertText = `${p.id}: `;
        command = { id: 'editor.action.triggerSuggest', title: '' };
      }
      if (!suggestions.find(s => s.label === p.id)) {
        suggestions.push({
          label: p.id,
          kind: monaco.languages.CompletionItemKind.Function,
          documentation,
          insertText,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: p.type,
          command
        });
        if (!['code'].includes(p.type)) {
          suggestions.push({
            label: '!' + p.id + '(evaluated)',
            kind: monaco.languages.CompletionItemKind.Function,
            documentation,
            insertText: `<!${p.id}>\n${'$0'}\n</${p.id}>`,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: p.type
          });
        }
      }
    });

  const lines = textUntilPosition.split('\n');
  const currLine = lines[lines.length - 1];
  if (currLine.match(/(.+):(\s*)/)) {
    const prop = RegExp.$1.trim();
    const whitespace = RegExp.$2;
    const pattern = patterns.find(p => p.path === path && p.id === prop);
    suggestions = [];
    if (pattern && pattern.suggestions)
      suggestions = pattern.suggestions.map(text => {
        return {
          label: text,
          kind: monaco.languages.CompletionItemKind.Property,
          detail: 'suggestion',
          insertText: whitespace ? text : ` ${text}`
        };
      });
  }
  return suggestions;
}

export function registerAutoCompletion(editor: monaco.editor.IStandaloneCodeEditor) {
  (editor as any).onDidType(function(text) {
    if (text !== ':') return;

    const model = editor.getModel();
    const position = editor.getPosition();
    const textUntilPosition = model.getValueInRange({
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: position.lineNumber,
      endColumn: position.column
    });
    const lines = textUntilPosition.split('\n');
    const currLine = lines[lines.length - 1];
    if (currLine.match(/(.+):(\s*)/)) {
      editor.trigger('anything', 'editor.action.triggerSuggest', {});
    }
  });
}
