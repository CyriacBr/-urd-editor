import { Model, ModelField, Urd, BlockMatch } from '@urd/core';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';

/*
{
	tokenizer: {
		root: [
            [/(<script)/, { token: 'entity.name.tag', next: '@script' }],
            [/(\s*<evalProp)/, { token: 'entity.name.tag', next: '@block_evalProp' }],

            [/^(\s*<.+\:)(\s+)(.+)(>)/, ["tag", "", "tag-param", "tag"]],
            [/^(.+)\:/, "prop"],
            [/^\s*<\S+>/, "tag"]
		],

        script: [
			[/>/, { token: 'entity.name.tag', next: '@scriptEmbedded', nextEmbedded: 'text/javascript' }],
			[/[ \t\r\n]+/], // whitespace
			[/(<\/)(script\s*)(>)/, ['entity.name.tag', 'entity.name.tag', { token: 'entity.name.tag', next: '@pop' }]]
		],
        scriptEmbedded: [
			[/<\/script/, { token: '@rematch', next: '@pop', nextEmbedded: '@pop' }],
			[/[^<]+/, '']
		],

        block_evalProp: [
            [/>/, 'entity.name.tag'],
            [/(\s*<nested)/, { token: 'entity.name.tag', next: '@script_nested' }],
			[/(<\/)(evalProp\s*)(>)/, ['entity.name.tag', 'entity.name.tag', { token: 'entity.name.tag', next: '@pop' }]]
        ],
        script_nested: [
			[/>/, { token: 'entity.name.tag', next: '@scriptEmbedded_nested', nextEmbedded: 'text/javascript' }],
			[/[ \t\r\n]+/], // whitespace
			[/(<\/)(nested\s*)(>)/, ['entity.name.tag', 'entity.name.tag', { token: 'entity.name.tag', next: '@pop' }]]
		],
        scriptEmbedded_nested: [
			[/<\/nested/, { token: '@rematch', next: '@pop', nextEmbedded: '@pop' }],
			[/[^<]+/, '']
		],
	}
}
*/

export function makeTokenizer(model: Model) {
  return {
    tokenizer: {
      root: [...getExtraRootTokenizer(model), ...getBaseRootTokenizer()],

      ...getBaseTokenizer(model)
    }
  };
}

export function getBaseTokenizer(model: Model) {
  let data = {};

  for (const [prop, field] of Object.entries(model)) {
    if (field.type === 'structure') {
      data = {
        ...data,
        ...makeBlockToken(prop, field)
      };
    } else if (field.type === 'text') {
      let regex = new RegExp(`(<\/)(${prop}\\s*)(>)`);
      data[`text_${prop}`] = [
        [/>/, 'delimiter'],
        [regex, ['delimiter', 'entity.name.tag', { token: 'delimiter', next: '@pop' }]],
        [/./, 'text']
      ];
    } else {
      let token = ['code', 'list'].includes(field.type) ? 'entity.name.tag' : 'prop-tag';
      let regex = new RegExp(`(<\/)(${prop}\\s*)(>)`);
      data[`script_${prop}`] = [
        [/>/, { token: 'delimiter', next: `@scriptEmbedded_${prop}`, nextEmbedded: 'text/javascript' }],
        [/[ \t\r\n]+/],
        [regex, ['delimiter', token, { token: 'delimiter', next: '@pop' }]]
      ];
      regex = new RegExp(`<\/${prop}`);
      data[`scriptEmbedded_${prop}`] = [
        [regex, { token: '@rematch', next: '@pop', nextEmbedded: '@pop' }],
        [/[^<]+/, '']
      ];
    }
  }
  return data;
}

export function getBaseRootTokenizer() {
  return [
    [/^(\s*<)(.+)(:)(\s+)(.+)(>)/, ['delimiter', 'entity.name.tag', 'operator', '', 'tag-param', 'delimiter']],
    [/^(.+)(:)/, ['entity.name.tag', 'operator']],
    [/^(\s*<)(\S+)(>)/, ['delimiter', 'entity.name.tag', 'delimiter']]
  ];
}

export function getExtraRootTokenizer(model: Model) {
  const data = [];
  for (const [prop, field] of Object.entries(model)) {
    if (field.type === 'structure') {
      data.push(makeBlockTokenForRoot(prop, field));
    } else if (field.type === 'text') {
      let regex = new RegExp(`(\\s*<)(${prop})`);
      data.unshift([regex, ['delimiter', { token: 'entity.name.tag', next: `@text_${prop}` }]]);
    } else {
      let token = ['code', 'list'].includes(field.type) ? 'entity.name.tag' : 'prop-tag';
      let regex = new RegExp(`(\\s*<)(${prop})`);
      data.unshift([regex, ['delimiter', { token, next: `@script_${prop}` }]]);
    }
  }
  return data;
}

function makeBlockTokenForRoot(prop: string, field: ModelField) {
  let regex = new RegExp(`(\\s*<)(${prop})`);
  return [regex, ['delimiter', { token: 'entity.name.tag', next: `@block_${prop}` }]];
}

function makeBlockToken(prop: string, field: ModelField) {
  let data = {};
  let regex = new RegExp(`(<\/)(${prop}\\s*)(>)`);
  data[`block_${prop}`] = [
    [regex, ['delimiter', 'entity.name.tag', { token: 'delimiter', next: '@pop' }]],
    [/(^.+)(:)/, ['entity.name.tag', 'operator']]
  ];
  for (const [subProp, subField] of Object.entries(field.fields)) {
    if (['text', 'list', 'code'].includes(subField.type)) {
      let regex = new RegExp(`(\\s*<)(${subProp})`);
      data[`block_${prop}`].unshift([
        regex,
        ['delimiter', { token: 'entity.name.tag', next: `@text_${prop}_${subProp}` }]
      ]);
      regex = new RegExp(`(<\/)(${subProp}\\s*)(>)`);
      data[`text_${prop}_${subProp}`] = [
        [/>/, 'delimiter'],
        [regex, ['delimiter', 'entity.name.tag', { token: 'delimiter', next: '@pop' }]],
        [/./, 'text']
      ];
    } else {
      let regex = new RegExp(`(\\s*<)(${subProp})`);
      data[`block_${prop}`].unshift([regex, ['delimiter', { token: 'prop-tag', next: `@script_${prop}_${subProp}` }]]);
      regex = new RegExp(`(<\/)(${subProp}\\s*)(>)`);
      data[`script_${prop}_${subProp}`] = [
        [/>/, { token: 'delimiter', next: `@scriptEmbedded_${prop}_${subProp}`, nextEmbedded: 'text/javascript' }],
        [/[ \t\r\n]+/],
        [regex, ['delimiter', 'prop-tag', { token: 'delimiter', next: '@pop' }]]
      ];
      regex = new RegExp(`<\/${subProp}`);
      data[`scriptEmbedded_${prop}_${subProp}`] = [
        [regex, { token: '@rematch', next: '@pop', nextEmbedded: '@pop' }],
        [/[^<]+/, '']
      ];
    }
  }
  data[`block_${prop}`].unshift([/>/, 'delimiter']);
  return data;
}

class State implements monaco.languages.IState {
  data: { isInsideBlock?: boolean; isBlockCode?: boolean; paths: string[] };
  constructor(data = { paths: ['__root__'] }) {
    this.data = { ...data };
    if (this.data.paths.length === 0) {
      this.data.paths = ['__root__'];
    }
  }

  clone() {
    return new State(this.data);
  }

  equals(other) {
    return other === this;
  }
}

interface RealState {
  paths: string[];
  isBlockCode: boolean;
  isInsideBlock: boolean;
}

export function applyTokenizer(model: Model) {
  const patterns = Urd.makePatterns(model);
  console.log('patterns :', patterns);

  const getRealState = (lines: string[]) => {
    const state = {
      paths: ['__root__'],
      isBlockCode: false,
      isInsideBlock: false
    };
    for (const line of lines) {
      const match = Urd.matchBlock(line);
      if (match.starting) {
        const prop = match.prop;
        const path = state.paths.join('.');
        const pattern = patterns.find(p => p.path === path && p.id === prop.trim());
        if (pattern) {
          state.isBlockCode = match.isEval || pattern.type === 'code';
          state.isInsideBlock = pattern.type === 'structure' ? match.isEval : true;
        }
        state.paths.push(prop);
      } else if (match.ending) {
        state.paths.pop();
        state.isBlockCode = false;
        state.isInsideBlock = false;
      }
    }
    return state;
  };

  monaco.languages.setTokensProvider('userDeclaration', {
    getInitialState: () => new State(),

    tokenize: (line: string, state: State, buffer: any, lineIndex: any) => {
      let tokens: monaco.languages.IToken[] = [];
      const endState = new State(state.data);
      const linesUntil = [];
      for (let i = 0; i <= lineIndex; i++) {
        linesUntil[i] = buffer.getLineContent(i);
      }
      const realState = getRealState(linesUntil);
      const match = Urd.matchBlock(line);
      if (!realState.isInsideBlock) {
        if (match.inline) {
          tokens = tokens.concat(makePropTokens(match));
        } else if (match.starting && match.isEval && !match.parameter) {
          tokens = tokens.concat(makeEvalBlockStartTokens(match));
        } else if (match.starting && !match.isEval && !match.parameter) {
          tokens = tokens.concat(makeBlockStartTokens(match));
        } else if (match.starting && !match.isEval && match.parameter) {
          tokens = tokens.concat(makeBlockWithParamStartTokens(match));
        } else if (match.starting && match.isEval && match.parameter) {
          tokens = tokens.concat(makeEvalBlockWithParamStartTokens(match));
        } else if (match.ending) {
          tokens = tokens.concat(makeBlockEndTokens(match));
        } else {
          // console.log('unknown format: ', line);
        }
      } else {
        if (match.ending) {
          tokens = tokens.concat(makeBlockEndTokens(match));
        } else {
          tokens = makeBlockInsideTokens(line, realState);
        }
      }
      return {
        endState,
        tokens
      };
    }
  } as any);
}

function makePropTokens(match: BlockMatch): monaco.languages.IToken[] {
  const { prop, propPosition } = match;
  return [
    { startIndex: 0, scopes: 'entity.name.tag' },
    { startIndex: propPosition + prop.length, scopes: 'my-delimiter' },
    { startIndex: propPosition + prop.length + 1, scopes: 'string.quoted.double.html' }
  ];
}

function makeBlockStartTokens(match: BlockMatch): monaco.languages.IToken[] {
  const { prop, propPosition } = match;
  return [
    { startIndex: 0, scopes: 'my-delimiter' },
    { startIndex: propPosition, scopes: 'entity.name.tag' },
    { startIndex: propPosition + prop.length, scopes: 'my-delimiter' }
  ];
}

function makeEvalBlockStartTokens(match: BlockMatch): monaco.languages.IToken[] {
  const { prop, propPosition } = match;
  return [
    { startIndex: 0, scopes: 'my-delimiter' },
    { startIndex: 1, scopes: 'entity.other.attribute-name' },
    { startIndex: propPosition + 1, scopes: 'entity.name.tag' },
    { startIndex: propPosition + prop.length + 1, scopes: 'my-delimiter' }
  ];
}

function makeBlockWithParamStartTokens(match: BlockMatch): monaco.languages.IToken[] {
  const { prop, propPosition, parameter } = match;

  return [
    { startIndex: 0, scopes: 'my-delimiter' },
    { startIndex: propPosition, scopes: 'entity.name.tag' },
    { startIndex: propPosition + prop.length, scopes: 'my-delimiter' },
    { startIndex: propPosition + prop.length + 1, scopes: 'entity.other.attribute-name' },
    { startIndex: propPosition + prop.length + 1 + parameter.length, scopes: 'my-delimiter' }
  ];
}

function makeEvalBlockWithParamStartTokens(match: BlockMatch): monaco.languages.IToken[] {
  const { prop, propPosition, parameter } = match;

  return [
    { startIndex: 0, scopes: 'my-delimiter' },
    { startIndex: 1, scopes: 'entity.other.attribute-name' },
    { startIndex: 1 + propPosition, scopes: 'entity.name.tag' },
    { startIndex: 1 + propPosition + prop.length, scopes: 'my-delimiter' },
    { startIndex: 1 + propPosition + prop.length + 1, scopes: 'entity.other.attribute-name' },
    { startIndex: 1 + propPosition + prop.length + 1 + parameter.length, scopes: 'my-delimiter' }
  ];
}

function makeBlockEndTokens(match: BlockMatch): monaco.languages.IToken[] {
  const { prop, propPosition } = match;

  return [
    { startIndex: 0, scopes: 'my-delimiter' },
    { startIndex: propPosition, scopes: 'entity.name.tag' },
    { startIndex: propPosition + prop.length, scopes: 'my-delimiter' }
  ];
}

function makeBlockInsideTokens(line: string, state: RealState): monaco.languages.IToken[] {
  if (state.isBlockCode) {
    const tokens = [];
    const tsTokens = monaco.editor.tokenize(line, 'typescript');
    for (const [i, tokens_] of Object.entries(tsTokens)) {
      for (const token of tokens_) {
        tokens.push({
          startIndex: token.offset,
          scopes: token.type
        });
      }
    }
    return tokens;
  } else {
    return [{ startIndex: 0, scopes: 'string.quoted.double.html' }];
  }
}
