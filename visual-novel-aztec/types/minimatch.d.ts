declare module 'minimatch' {
  interface IOptions {
    debug?: boolean;
    nobrace?: boolean;
    noglobstar?: boolean;
    dot?: boolean;
    noext?: boolean;
    nocase?: boolean;
    nonull?: boolean;
    matchBase?: boolean;
    nocomment?: boolean;
    nonegate?: boolean;
    flipNegate?: boolean;
  }

  class Minimatch {
    constructor(pattern: string, options?: IOptions);
    match(fname: string): boolean;
    matchOne(file: string[], pattern: string[]): boolean;
    makeRe(): RegExp | false;
    debug(): void;
    set: string[][];
    pattern: string;
    regexp: RegExp | false;
    negate: boolean;
    options: IOptions;
  }

  function minimatch(target: string, pattern: string, options?: IOptions): boolean;
  
  namespace minimatch {
    type IOptions = minimatch.IOptions;
    type IMinimatch = Minimatch;
    var Minimatch: typeof minimatch.Minimatch;
  }

  export = minimatch;
}
