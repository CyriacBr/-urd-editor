import { create } from './editor';

window.onload = () => {
  const model = {
    name: {
      desc: 'The name of the test.',
      type: 'string',
      default: 'MyTest'
    },
    prop: {
      desc: 'A prop that can be evaluated',
      type: 'string',
      default: 'Blah blah'
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
          default: 'haha'
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
  create('container', model);
};
