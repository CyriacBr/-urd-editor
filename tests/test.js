import * as Editor from './dist/app.bundle.js';
import text from './text.js';
console.log('Editor :', Editor);
window.onload = () => {
  console.log('Editor :', Editor);
  const model = {
    name: {
      desc: 'The name of the test.',
      type: 'string',
      default: 'MyTest',
      context: '{ actor: { name: string } }'
    },
    prop: {
      desc: 'A prop that can be evaluated',
      type: 'string',
      suggestions: ['circle(x)', 'square(x)']
    },
    myList: {
      type: 'list'
    },
    myText: {
      type: 'text'
    },
    myCode: {
      type: 'code'
    },
    myObj: {
      type: 'structure',
      fields: {
        num: {
          type: 'string',
          default: 'haha',
          suggestions: ['circle(x)', 'square(x)']
        },
        val: {
          type: 'string',
          default: 'hoho'
        },
        nestedList: {
          type: 'list'
        },
        nestedText: {
          type: 'text'
        },
        nestedCode: {
          type: 'code'
        }
      }
    }
  };
  Editor.create(document.getElementById('container'), model);
  Editor.setText(text);
};
