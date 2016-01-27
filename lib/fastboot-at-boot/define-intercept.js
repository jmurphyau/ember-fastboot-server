
var defineIntercepts = [];
var currentDefine = define;

var define = function(name, deps, callback) {
  var defineOverride = defineIntercepts.find(function(intercept) {
    return intercept.test(name, deps, callback);
  });

  if (defineOverride) {
    return defineOverride.override(name, deps, callback);
  } else {
    return currentDefine.apply(this, arguments);
  }
}
define.prototype = Object.create(currentDefine.prototype);

// intercept and override the clear-double-boot intance instance-initializer
// it makes more sense to actually put the clear-double-boot initializer into
// the app.js file before serving it to the browser.. This will allow for a smaller
// app.js file that can be used in a production environment that doesnt have
// any fastboot related code - and only when serves via fastboot the code would
// be added and sent through to the browser

(function(intercepts, define) {

  function interceptTest(name, deps, callback) {
    return name.match(/\/instance-initializers\/browser\/clear-double-boot/g);
  }

  function interceptOverride(name, deps, callback) {
    function clearDoubleBootOverride(exports) {
      function noop(instance) {}
      exports["default"] = { name: "clear-double-boot", initialize: noop }
    }

    define(name, deps, clearDoubleBootOverride);
  }

  intercepts.push({ test: interceptTest, override: interceptOverride });

}(defineIntercepts, currentDefine));

// add an alias to the app/config/environment as ~/config/environment
// the use of ~/ inspired by bash $HOME variable

(function(intercepts, define) {

  intercepts.push({
    test: function(name, deps, callback) {
      return name.match(/^([^/]*)\/config\/environment$/g);
    },
    override: function(name, deps, callback) {
      define(name, deps, callback);
      define('~/config/environment', deps, define.alias(name));
    }
  });

}(defineIntercepts, currentDefine));

// defining  '~/app' (another alias like above)

(function(intercepts, define) {

  intercepts.push({
    test: function(name, deps, callback) {
      return name.match(/^([^/]*)\/app$/g);
    },
    override: function(name, deps, callback) {
      define(name, deps, callback);
      define('~/app', deps, define.alias(name));
    }
  });

}(defineIntercepts, currentDefine));
