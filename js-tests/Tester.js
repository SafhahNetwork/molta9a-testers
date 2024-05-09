const stream = require("node:stream");
const ivm = require("isolated-vm");

module.exports = class Tester {
  constructor(memoryLimitMB = 128) {
    this.isolate = new ivm.Isolate({ memoryLimit: memoryLimitMB });
    this.context = this.isolate.createContextSync();
    this.jail = this.context.global;

    this.intercepted = [];
    this.banned = [];

    this._setupConsole();

    this.jail.setSync("global", this.jail.derefInto());
  }

  _setupConsole() {
    class StringWritableStream extends stream.Writable {
      constructor(options) {
        super(options);
        this.data = "";
      }

      _write(chunk, _, callback) {
        this.data += chunk.toString();
        callback();
      }
    }

    const output = new StringWritableStream();

    this.output = output;
    this.console = new console.Console(output, output);
  }

  setFunction(name, fn) {
    this.jail.setSync(
      name,
      new ivm.Reference((...args) => fn(...args)).derefInto(),
    );
  }

  intercept(functions) {
    this.intercepted = [...this.intercepted, ...functions];
    functions.forEach((fn) => {
      if (fn.split(".")[0] === "console") {
        this.context.evalClosureSync(
          `globalThis.console.${fn.split(".")[1]} = $0`,
          [(...args) => this.console[fn.split(".")[1]](...args)],
        );
        return;
      }
      this.context.evalClosureSync(
        `globalThis.${fn} = ()=>{throw new Error("${fn} is not allowed")}`,
        [(...args) => this.console[fn.split(".")[1]](...args)],
      );
    });
  }

  ban(identifiers) {
    this.banned = [...this.banned, ...identifiers];
    identifiers.forEach((id) => {
      this.context.evalClosureSync(`globalThis.${id} = undefined`, [
        (...args) => this.console[fn.split(".")[1]](...args),
      ]);
    });
  }

  spyOnVariables(vars) {
    this.spyVariables = vars;
  }

  execute(script, filename, timeout = 100) {
    this.error = null;
    const wrappedScript = `${script}`;
    if (!!this.spyVariables && this.spyVariables?.length > 0) {
      wrappedScript = `${script}
IWroteThisSpyVariableAt_06_05_2024_23_28_32_DrinkingChocolatMilk = {
${this.spyVariables?.map((v) => `${v}: ["number", "string", "boolean", "bigint"].includes(typeof ${v}) ? ${v} : typeof ${v}`).join(",\n")}
}`;
    }
    var compiledScript;
    try {
      compiledScript = this.isolate.compileScriptSync(wrappedScript, {
        filename,
      });
    } catch (err) {
      this.error = err;
      return;
    }
    try {
      return compiledScript.runSync(this.context, {
        timeout: timeout,
        filename,
      });
    } catch (err) {
      const errSrc = err?.stack?.split("\n")?.[1]?.split("at ")?.[1];
      if (errSrc) {
        err.message += " [" + errSrc + "]";
      }

      this.error = err;
      return;
    }
  }

  getOutput() {
    return this.output.data;
  }

  getError() {
    return this.error;
  }

  getSpies() {
    return this.context.global
      .getSync(
        "IWroteThisSpyVariableAt_06_05_2024_23_28_32_DrinkingChocolatMilk",
      )
      ?.copySync();
  }
};

// Usage example::
//
/**
const isolatedEnv = new Tester();
isolatedEnv.intercept(["console.log", "fetch"]);
isolatedEnv.ban(["eval"]);
isolatedEnv.spyOnVariables(["name", "message"]);

const script = `
  const name = ()=> {
    return 1 + 4
  }
  const message = !!43n;
  console.log("Hello, ")
  fetch("console.log('boo')")
  eval("");
`;

const r = isolatedEnv.execute(script);
console.log("res: ", r);

console.log("Spies:", isolatedEnv.getSpies());
console.log("Output:", isolatedEnv.getOutput());
console.log("Error:", isolatedEnv.getError());
**/
