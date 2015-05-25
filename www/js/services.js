angular.module('starter.services', [])
    .constant('DEFAULT_SETTINGS', {
      name:'',
      phone:''
    })

    .factory('Settings', function ($rootScope, DEFAULT_SETTINGS) {
      var _settings = {};
      if (typeof window.localStorage['settings'] != 'undefined') {
        try {
          _settings = JSON.parse(window.localStorage['settings']);
        } catch (e) {
          console.log("Error" + e);
        }
      }

      // Just in case we have new settings that need to be saved
      _settings = angular.extend({}, DEFAULT_SETTINGS, _settings);

      if (!_settings) {
        window.localStorage['settings'] = JSON.stringify(_settings);
      }

      var obj = {
        getSettings: function () {
          return _settings;
        },

        saveSettings: function (newSettings) {
          _settings = newSettings;
          this.save();
        },
        // Save the settings to localStorage
        save: function () {
          window.localStorage['settings'] = JSON.stringify(_settings);
        },
        // Get a settings val
        get: function (k) {
          return _settings[k];
        },
        // Set a settings val
        set: function (k, v) {
          _settings[k] = v;
          this.save();
        },

        getUsername: function () {
          return _settings['name'] || '';
        },

        getPhonenumber: function () {
          return _settings['phone'] || '';
        }
      }

      // Save the settings to be safe
      obj.save();
      return obj;
    })
;