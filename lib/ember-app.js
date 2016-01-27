var fs = require('fs');
var path = require('path');

var sandbox = require('./sandbox');
var SimpleDOM = require('simple-dom');
var RSVP    = require('rsvp');
var chalk = require('chalk');
var najax = require('najax');
var debug   = require('debug')('ember-cli-fastboot:ember-app');
var emberDebug = require('debug')('ember-cli-fastboot:ember');

var HTMLSerializer = new SimpleDOM.HTMLSerializer(SimpleDOM.voidMap);

function EmberApp(options) {
  var distPath = options.distPath;

  this.appFilePath = options.appFile;
  this.vendorFilePath = options.vendorFile;
  this.moduleWhitelist = options.moduleWhitelist;
  this.fastBootAtBoot = options.fastBootAtBoot;

  debug("app created; app=%s; vendor=%s", this.appFilePath, this.vendorFilePath);

  this.moduleWhitelist.forEach(function(whitelistedModule) {
    debug("module whitelisted; module=%s", whitelistedModule);
  });

  // Create the sandbox, giving it the resolver to resolve once the app
  // has booted.
  var sandboxRequire = buildWhitelistedRequire(this.moduleWhitelist, distPath);
  var sandboxInstance = sandbox.createSandbox({
    najax: najax,
    FastBoot: { require: sandboxRequire }
  });

  if (this.fastBootAtBoot) {
    sandbox.runFileInSandbox(this.vendorFilePath, sandboxInstance);
    sandbox.runCodeInSandbox('var runningTests = true;', sandboxInstance); // this is a hack to stop the app from autobooting - should be removed when possible.
    sandbox.runFileInSandbox(path.resolve('lib/fastboot-at-boot/define-intercept.js'), sandboxInstance);

    sandbox.runFileInSandbox(this.appFilePath, sandboxInstance);
    sandbox.runFileInSandbox(path.resolve('lib/fastboot-at-boot/initializers/ajax.js'), sandboxInstance);
    sandbox.runFileInSandbox(path.resolve('lib/fastboot-at-boot/initializers/dom-helper-patches.js'), sandboxInstance);
    sandbox.runFileInSandbox(path.resolve('lib/fastboot-at-boot/app-factory.js'), sandboxInstance);
  } else {
    sandbox.runFileInSandbox(this.vendorFilePath, sandboxInstance);
    sandbox.runFileInSandbox(this.appFilePath, sandboxInstance);
  }

  var AppFactory = sandboxInstance.require('~fastboot/app-factory');

  if (!AppFactory || typeof AppFactory['default'] !== 'function') {
    throw new Error('Failed to load Ember app from ' + this.appFilePath + ', make sure it was built for FastBoot with the `ember fastboot:build` command.');
  }

  this._app = AppFactory['default']();
}

EmberApp.prototype.boot = function() {
  return this._app.boot();
};

EmberApp.prototype.visit = function(url) {
  var doc = new SimpleDOM.Document();
  var rootElement = doc.body;
  var options = { isBrowser: false, document: doc, rootElement: rootElement };

  return this._app.visit(url, options).then(function(instance) {
    try {
      return {
        url: instance.getURL(), // TODO: use this to determine whether to 200 or redirect
        title: doc.title,
        body: HTMLSerializer.serialize(rootElement) // This matches the current code; but we probably want `serializeChildren` here
      };
    } finally {
      instance.destroy();
    }
  });
};

function buildWhitelistedRequire(whitelist, distPath) {
  return function(moduleName) {
    if (whitelist.indexOf(moduleName) > -1) {
      return require(path.join(distPath, 'node_modules', moduleName));
    } else {
      throw new Error("Unable to require module '" + moduleName + "' because it was not in the whitelist.");
    }
  };
}

module.exports = EmberApp;
