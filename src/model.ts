export type Model = { [property: string]: ModelField };
export type ModelSet = { [modelName: string]: Model };

export interface ModelField {
  type: string;
  display?: string;
  desc?: string;
  default?: string;
  fields?: { [index: string]: ModelField };
}

export function makePaths(model: Model) {
  let modelPatterns: any[] = [];

  const makePattern = (data = model, iniPath = '__root__') => {
    let path = iniPath;
    for (const [key, value] of Object.entries(data)) {
      let id = value.display || key;
      if (typeof value === 'object') {
        modelPatterns.push({
          id,
          path,
          type: value.type,
          desc: value.desc,
          realKey: key
        });
        if ('fields' in value) {
          path += '.' + id;
          makePattern(value.fields, path);
        }
      }
    }
  };
  makePattern();
  console.log('modelPatterns :', modelPatterns);
  return modelPatterns;
}
