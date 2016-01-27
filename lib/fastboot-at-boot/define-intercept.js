
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
// eventually it might make more sense to do a `isFastBoot()' style check in the initializer?
(function(intercepts, define) {

  function interceptTest(name, deps, callback) {
    return name.match(/\/instance-initializers\/browser\/clear-double-boot/g);
  }

  function interceptOverride(name, deps, callback) {
    function clearDoubleBootOverride(exports) {
      function noop(instance) {}
      exports["default"] = { name: "clear-double-boot", initialize: noop }
    }

    return define(name, deps, clearDoubleBootOverride);
  }


  intercepts.push({ test: interceptTest, override: interceptOverride });

}(defineIntercepts, currentDefine));
