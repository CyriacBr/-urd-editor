import { Model, ModelField } from './model';

/*
{
	tokenizer: {
		root: [
            [/(<script)/, { token: 'tag', next: '@script' }],
            [/(\s*<evalProp)/, { token: 'tag', next: '@block_evalProp' }],

            [/^(\s*<.+\:)(\s+)(.+)(>)/, ["tag", "", "tag-param", "tag"]],
            [/^(.+)\:/, "prop"],
            [/^\s*<\S+>/, "tag"]
		],

        script: [
			[/>/, { token: 'tag', next: '@scriptEmbedded', nextEmbedded: 'text/javascript' }],
			[/[ \t\r\n]+/], // whitespace
			[/(<\/)(script\s*)(>)/, ['tag', 'tag', { token: 'tag', next: '@pop' }]]
		],
        scriptEmbedded: [
			[/<\/script/, { token: '@rematch', next: '@pop', nextEmbedded: '@pop' }],
			[/[^<]+/, '']
		],

        block_evalProp: [
            [/>/, 'tag'],
            [/(\s*<nested)/, { token: 'tag', next: '@script_nested' }],
			[/(<\/)(evalProp\s*)(>)/, ['tag', 'tag', { token: 'tag', next: '@pop' }]]
        ],
        script_nested: [
			[/>/, { token: 'tag', next: '@scriptEmbedded_nested', nextEmbedded: 'text/javascript' }],
			[/[ \t\r\n]+/], // whitespace
			[/(<\/)(nested\s*)(>)/, ['tag', 'tag', { token: 'tag', next: '@pop' }]]
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
      data[`text_${prop}`] = [[/>/, 'tag'], [regex, ['tag', 'tag', { token: 'tag', next: '@pop' }]], [/./, 'text']];
    } else {
      let token = ['code', 'list'].includes(field.type) ? 'tag' : 'prop-tag';
      let regex = new RegExp(`(<\/)(${prop}\\s*)(>)`);
      data[`script_${prop}`] = [
        [/>/, { token, next: `@scriptEmbedded_${prop}`, nextEmbedded: 'text/javascript' }],
        [/[ \t\r\n]+/],
        [regex, [token, token, { token, next: '@pop' }]]
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
  return [[/^(\s*<.+\:)(\s+)(.+)(>)/, ['tag', '', 'tag-param', 'tag']], [/^(.+)\:/, 'prop'], [/^\s*<\S+>/, 'tag']];
}

export function getExtraRootTokenizer(model: Model) {
  const data = [];
  for (const [prop, field] of Object.entries(model)) {
    if (field.type === 'structure') {
      data.push(makeBlockTokenForRoot(prop, field));
    } else if (field.type === 'text') {
      let regex = new RegExp(`(\\s*<${prop})`);
      data.unshift([regex, { token: 'tag', next: `@text_${prop}` }]);
    } else {
      let token = ['code', 'list'].includes(field.type) ? 'tag' : 'prop-tag';
      let regex = new RegExp(`(\\s*<${prop})`);
      data.unshift([regex, { token, next: `@script_${prop}` }]);
    }
  }
  return data;
}

function makeBlockTokenForRoot(prop: string, field: ModelField) {
  let regex = new RegExp(`(\s*<${prop})`);
  return [regex, { token: 'tag', next: `@block_${prop}` }];
}

function makeBlockToken(prop: string, field: ModelField) {
  let data = {};
  let regex = new RegExp(`(<\/)(${prop}\\s*)(>)`);
  data[`block_${prop}`] = [[regex, ['tag', 'tag', { token: 'tag', next: '@pop' }]], [/^(.+)\:/, 'prop']];
  for (const [subProp, subField] of Object.entries(field.fields)) {
    if (subField.type === 'text') {
      let regex = new RegExp(`(\\s*<${subProp})`);
      data[`block_${prop}`].unshift([regex, { token: 'tag', next: `@text_${prop}_${subProp}` }]);
      regex = new RegExp(`(<\/)(${subProp}\\s*)(>)`);
      data[`text_${prop}_${subProp}`] = [
        [/>/, 'tag'],
        [regex, ['tag', 'tag', { token: 'tag', next: '@pop' }]],
        [/./, 'text']
      ];
    } else {
      let regex = new RegExp(`(\\s*<${subProp})`);
      data[`block_${prop}`].unshift([regex, { token: 'prop-tag', next: `@script_${prop}_${subProp}` }]);
      regex = new RegExp(`(<\/)(${subProp}\\s*)(>)`);
      data[`script_${prop}_${subProp}`] = [
        [/>/, { token: 'prop-tag', next: `@scriptEmbedded_${prop}_${subProp}`, nextEmbedded: 'text/javascript' }],
        [/[ \t\r\n]+/],
        [regex, ['prop-tag', 'prop-tag', { token: 'prop-tag', next: '@pop' }]]
      ];
      regex = new RegExp(`<\/${subProp}`);
      data[`scriptEmbedded_${prop}_${subProp}`] = [
        [regex, { token: '@rematch', next: '@pop', nextEmbedded: '@pop' }],
        [/[^<]+/, '']
      ];
    }
  }
  data[`block_${prop}`].unshift([/>/, 'tag']);
  return data;
}
