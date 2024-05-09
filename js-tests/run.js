const Tester = require("./Tester");
const path = require("path");
const fs = require("fs");

function run(filePath) {
  const script = fs.readFileSync(path.join("./student/", filePath), "utf-8");

  const isolatedEnv = new Tester();
  isolatedEnv.intercept([
    "console.log",
    "console.error",
    "console.info",
    "console.warn",
  ]);
  isolatedEnv.ban(["this", "process", "fetch"]);

  // Run the script
  isolatedEnv.execute(script, filePath);

  const output = isolatedEnv.getOutput();
  const error = isolatedEnv.getError();

  process.stdout.write(output);

  if (error) {
    process.stderr.write("------------------- Error -------------------\n");
    let msg = error.message;
    if (error.name) {
      msg = error.name + ": " + msg + "\n";
    }
    process.stderr.write(msg);
    process.stderr.write("---------------------------------------------\n");
    process.exit(1);
  } else {
    process.exit(0);
  }
}

if (process.argv.length !== 3) {
  console.error("Usage: node run.js <path_to_js_file>");
  process.exit(1);
}

const filePath = process.argv[2];
run(filePath);
