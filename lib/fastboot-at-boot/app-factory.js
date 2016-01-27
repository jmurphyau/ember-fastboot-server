
define('~fastboot/app-factory', ['~/app', '~/config/environment'], function(App, config) {
  App = App['default'];
  config = config['default'];

  config.APP.autoboot = false;

  return {
    'default': function() {
      return App.create(config.APP);
    }
  };
});
