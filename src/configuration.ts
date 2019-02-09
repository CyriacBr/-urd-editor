import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';

export const langConfig: monaco.languages.LanguageConfiguration = {
    brackets: [
        ['<!--', '-->'],
        ['<', '>'],
        ['{', '}'],
        ['(', ')']
    ],
    autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"' },
        { open: '\'', close: '\'' }
    ],
    surroundingPairs: [
        { open: '"', close: '"' },
        { open: '\'', close: '\'' },
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '<', close: '>' },
    ],
    folding: {
        markers: {
            start: new RegExp("^<[^\/]+>"),
            end: new RegExp("^<\/.+>")
        }
    }
};
