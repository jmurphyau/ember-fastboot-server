
var vm = require('vm');
var path = require('path');
var fs = require('fs');
var chalk = require('chalk');
var debug   = require('debug')('ember-cli-fastboot:sandbox');

function isLegacyVM() {
  // vm.isContext was added in 0.12.x
  return vm.isContext === undefined;
}

function createContext(sandbox) {
  if (isLegacyVM()) {
    var Contextify = require('contextify');
    Contextify(sandbox);
  } else {
    vm.createContext(sandbox);
  }
}

function runFileInSandbox(filePath, sandbox) {
  var fullPath = path.resolve(filePath);
  var fileContent = fs.readFileSync(fullPath, 'utf8');

  if (isLegacyVM()) {
    sandbox.run(fileContent, fullPath);
  } else {
    var fileScript = new vm.Script(fileContent, { filename: fullPath });
    fileScript.runInContext(sandbox);
  }
  debug('file evaluated in sandbox ('+filePath+')');
}

function runCodeInSandbox(code, sandbox) {
  if (isLegacyVM()) {
    sandbox.run(code);
  } else {
    var script = new vm.Script(code);
    script.runInContext(sandbox);
  }
  debug("code evaluated in sandbox");
}

function createSandbox(dependencies) {
  var wrappedConsole =  Object.create(console);
  wrappedConsole.error = function() {
    console.error.apply(console, Array.prototype.map.call(arguments, function(a) {
      return typeof a === 'string' ? chalk.red(a) : a;
    }));
  };

  var sandbox = {
    // Expose the console to the FastBoot environment so we can debug
    console: wrappedConsole,

    // setTimeout and clearTimeout are an assumed part of JavaScript environments. Expose it.
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,

    // Convince jQuery not to assume it's in a browser
    module: { exports: {} },

    URL: require("url")
  };

  for (var dep in dependencies) {
    sandbox[dep] = dependencies[dep];
  }

  // Set the global as `window`.
  sandbox.window = sandbox;
  sandbox.window.self = sandbox;

  // The sandbox is now a JavaScript context O_o
  createContext(sandbox);

  return sandbox;
}

module.exports = {
  createSandbox: createSandbox,
  runFileInSandbox: runFileInSandbox,
  runCodeInSandbox: runCodeInSandbox,
  isLegacyVM: isLegacyVM
}
