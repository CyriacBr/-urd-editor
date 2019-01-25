import { Model } from './model';
export declare function getBaseTokenizer(): {
    script: any[];
    scriptEmbedded: ((string | RegExp)[] | (RegExp | {
        token: string;
        next: string;
        nextEmbedded: string;
    })[])[];
};
export declare function getBaseRootTokenizer(): ((string | RegExp)[] | (RegExp | string[])[])[];
export declare function getScriptTokenizer(model: Model): (RegExp | {
    token: string;
    next: string;
})[][];
export declare function getTextTokenizer(model: Model): (string | RegExp)[][];
export declare function makeTokenizer(model: Model): {
    tokenizer: {
        root: ((string | RegExp)[] | (RegExp | {
            token: string;
            next: string;
        })[] | (RegExp | string[])[])[];
        script: any[];
        scriptEmbedded: ((string | RegExp)[] | (RegExp | {
            token: string;
            next: string;
            nextEmbedded: string;
        })[])[];
    };
};
