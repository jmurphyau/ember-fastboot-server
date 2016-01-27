
var config = require('~/config/environment');
var modulePrefix = config.modulePrefix;

define(modulePrefix+'/initializers/fastboot/dom-helper-patches', ['exports', 'require', 'Ember'], function(exports, require, Ember) {

  var URL = require('URL');

  exports["default"] = {
    name: "dom-helper-patches",

    initialize: function(App) {
      // TODO: remove me
      Ember.HTMLBars.DOMHelper.prototype.protocolForURL = function(url) {
        var protocol = URL.parse(url).protocol;
        return (protocol == null) ? ':' : protocol;
      };

      // TODO: remove me https://github.com/tildeio/htmlbars/pull/425
      Ember.HTMLBars.DOMHelper.prototype.parseHTML = function(html) {
        return this.document.createRawHTMLSection(html);
      };
    }
  };

});
