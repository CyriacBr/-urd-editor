import 'monaco-editor/esm/vs/editor/browser/controller/coreCommands.js';
import 'monaco-editor/esm/vs/editor/contrib/snippet/snippetController2.js';
import 'monaco-editor/esm/vs/editor/contrib/suggest/suggestController.js';
import 'monaco-editor/esm/vs/editor/contrib/hover/hover.js';
import 'monaco-editor/esm/vs/editor/contrib/codelens/codelensController.js';
import 'monaco-editor/esm/vs/editor/contrib/folding/folding.js';
import 'monaco-editor/esm/vs/editor/contrib/contextmenu/contextmenu.js';
import 'monaco-editor/esm/vs/editor/contrib/codeAction/codeAction.js';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution';
import 'monaco-typescript-embeddable/release/esm/monaco.contribution';
import { Model } from '@urd/core';
import { makeTokenizer, applyTokenizer } from './tokenizer';
import { makeCodelens } from './codelens';
import { makeCompletions, registerAutoCompletion } from './completion';
import { makeHoverMessage } from './hover';
import { applyEmbeddable } from './embeddable';
import { defineTheme } from './theme';
import { langConfig } from './configuration';

export class UrdEditor {
  editor: monaco.editor.IStandaloneCodeEditor;

  monacoEditor() {
    return this.editor;
  }

  addExtraLib(lib: string) {
    monaco.languages.typescript.typescriptDefaults.addExtraLib(lib);
  }

  setText(text: string) {
    this.editor.setValue(text);
  }

  getText() {
    return this.editor.getValue();
  }

  setReadOnly(value: boolean) {
    this.editor.updateOptions({ readOnly: value });
  }

  parse(): Object {
    return {};
  }

  setModel(model: Model) {
    applyEmbeddable(model, this.editor);
    monaco.languages.typescript.getTypeScriptWorker().then(
      resp => {
        console.log('Worker has beed loaded');
        // monaco.languages.setMonarchTokensProvider('userDeclaration', makeTokenizer(model) as any);
        applyTokenizer(model);
      },
      err => {
        console.log('Worker load error: ', err);
      }
    );
    monaco.languages.registerHoverProvider('userDeclaration', {
      provideHover: (m, position) => {
        return makeHoverMessage(model, position, this.editor) as any;
      }
    });

    monaco.languages.registerCompletionItemProvider('userDeclaration', {
      provideCompletionItems: (m, position) => {
        return { suggestions: makeCompletions(m, position, model) as any };
      }
    });
  }

  create(element: HTMLElement, model: Model) {
    monaco.languages.register({ id: 'userDeclaration' });
    monaco.languages.setLanguageConfiguration('userDeclaration', langConfig);
    defineTheme();
    this.editor = monaco.editor.create(element, {
      theme: 'urd-dark',
      language: 'userDeclaration',
      lightbulb: {
        enabled: true
      },
      fontWeight: '600',
      minimap: {
        enabled: false
      }
    });
    this.setModel(model);

    /*monaco.languages.registerCodeLensProvider('userDeclaration', {
    provideCodeLenses: (m, token) => {
      return makeCodelens(model, this.editor) as any;
    }
  })*/
    registerAutoCompletion(this.editor);

    /*
  monaco.languages.registerCodeActionProvider('userDeclaration', {
    provideCodeActions: (model, range, context, token) => {
      console.log('CODE_ACTION');
      return [
        {
          command: {
            id: 'command.id',
            title: 'command title'
          },
          score: 0,
          title: 'test'
        }
      ];
    }
  });*/
  }
}
