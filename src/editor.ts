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
import 'monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution';
// import 'monaco-editor/esm/vs/language/typescript/monaco.contribution';
 import 'monaco-typescript-embeddable/release/esm/monaco.contribution';
import { Model } from './model';
import { makeTokenizer } from './tokenizer';
import { makeCodelens } from './codelens';
import { makeCompletions } from './completion';
import { makeHoverMessage } from './hover';

export function create(elementId: string, model: Model) {
  monaco.languages.register({ id: 'userDeclaration' });
  monaco.languages.setMonarchTokensProvider('userDeclaration', makeTokenizer(model) as any);

  const { Embeddable } = monaco.languages.typescript as any;
  console.log('Embeddable :', Embeddable);

  Embeddable.setup('userDeclaration');
  Embeddable.setMakeModelContent(model => {
    let text = model.getValue();
    let inside = false;
    let result = [];
    let n = 0;
    for (const line of text.split('\n')) {
      if (line.match(/<myCode>/)) {
        inside = true;
        Embeddable.startBlock(n);
        const delimiter = 'function myCode() {';
        const extraChar = Embeddable.registerReplace(line, delimiter);
        n += extraChar;
        result.push(delimiter);
      } else if (line.match(/<\/myCode>/)) {
        inside = false;
        const delimiter = '}';
        const extraChar = Embeddable.registerReplace(line, delimiter);
        n += extraChar;
        Embeddable.endBlock(n);
        result.push(delimiter);
        break;
      } else if (inside) {
        result.push(line);
      } else {
        result.push(line.replace(/./gi, ' '));
      }
      n += line.length + 1;
    }
    return result.join('\n');
  });

  monaco.editor.defineTheme('urd-dark', {
    base: 'vs-dark',
    inherit: true,
    colors: {
      'editor.foreground': '#FFFFFF'
    },
    rules: [
      { token: 'prop', foreground: '#98c379' },
      { token: 'tag', foreground: '#e06c75' /*fontStyle: 'bold'*/ },
      { token: 'prop-tag', foreground: '#98c379' },
      { token: 'tag-param', foreground: '#d19a66', fontStyle: 'italic' }
      // { token: 'text', foreground: '#98c379' }
    ]
  });

  let editor = monaco.editor.create(document.getElementById(elementId), {
    theme: 'urd-dark',
    value: getCode(),
    language: 'userDeclaration',
    lightbulb: {
      enabled: true
    }
  });

  /*monaco.languages.registerCodeLensProvider('userDeclaration', {
    provideCodeLenses: function(m, token) {
      return makeCodelens(model, editor) as any;
    }
  })*/
  monaco.languages.registerHoverProvider('userDeclaration', {
    provideHover: function(m, position) {
      return makeHoverMessage(model, position, editor) as any;
    }
  });

  monaco.languages.registerFoldingRangeProvider('userDeclaration', {
    provideFoldingRanges: function(model, context, token) {
      return [
        {
          start: 15,
          end: 22
        }
      ];
    }
  });

  monaco.languages.registerCompletionItemProvider('userDeclaration', {
    provideCompletionItems: function(m, position) {
      console.log('COMPLETION');
      return { suggestions: makeCompletions(m, position, model) as any };
    }
  });

  monaco.languages.registerCodeActionProvider('userDeclaration', {
    provideCodeActions: function(model, range, context, token) {
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
  });

  const myCondition1 = editor.createContextKey(/*key name*/ 'myCondition1', /*default value*/ false);
  editor.onContextMenu(function(e) {
    console.log('LMAO');
    myCondition1.set(true);
  });

  editor.addAction({
    // An unique identifier of the contributed action.
    id: 'my-unique-id',

    // A label of the action that will be presented to the user.
    label: 'My Label!!!',

    // An optional array of keybindings for the action.
    keybindings: [
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.F10,
      // chord
      monaco.KeyMod.chord(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_K, monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_M)
    ],

    // A precondition for this action.
    precondition: 'myCondition1',

    // A rule to evaluate on top of the precondition in order to dispatch the keybindings.
    keybindingContext: null,

    contextMenuGroupId: 'navigation',

    contextMenuOrder: 1.5,

    // Method that will be executed when the action is triggered.
    // @param editor The editor instance is passed in as a convinience
    run: function(ed) {
      alert("i'm running => " + ed.getPosition());
      return null;
    }
  });

  function getCode() {
    return `name: Marc

<name>
return 'Marc';
</name>

prop: test
<prop>
return 'test';
</prop>

<myList>
item1
item2
</myList>

<myText>
Hello World
</myText>

<myCode>
function addition(a,b) {
    return a + b;
}
return addition(5,6);
</myCode>

<myObj>
    num: lol

    <num>
    return 'lol';
    </num>

    <nestedList>
    item1
    item2
    </nestedList>

    <nestedText>
    Hello world
    </nestedText>

    <nestedCode>
    return 'Hello';
    </nestedCode>
</myObj>`;
  }
}
