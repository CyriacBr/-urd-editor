import {UrdEditor} from './editor';
declare var window: any;
window.Userdec = {
  Editor: new UrdEditor()
};
export const Userdec = {
  Editor: window.Userdec.Editor as UrdEditor
};
