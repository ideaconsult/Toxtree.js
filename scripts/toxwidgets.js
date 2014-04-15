/* toxwidgets.js - A bunch of small components, serving as addition to other (main) kits. Currently; jToxQuery, jToxStructures
 *
 * Copyright 2012-2014, IDEAconsult Ltd. http://www.ideaconsult.net/
 * Created by Ivan Georgiev
**/

var jToxDsSearch = (function () {
  var defaultSettings = { // all settings, specific for the kit, with their defaults. These got merged with general (jToxKit) ones.
  };
  
  var cls = function (root, settings) {
    var self = this;
    self.rootElement = root;
    jT.$(root).addClass('jtox-toolkit'); // to make sure it is there even when manually initialized
    
    self.settings = jT.$.extend({}, defaultSettings, jT.settings, settings);
    
  };
  
  cls.prototype = {
    
  }; // end of prototype
  
  return cls;
})();
  
var jToxDsMenu = (function () {
  var defaultSettings = { // all settings, specific for the kit, with their defaults. These got merged with general (jToxKit) ones.
  };
  
  var cls = function (root, settings) {
    var self = this;
    self.rootElement = root;
    jT.$(root).addClass('jtox-toolkit'); // to make sure it is there even when manually initialized
    
    self.settings = jT.$.extend({}, defaultSettings, jT.settings, settings);
    
  };
  
  cls.prototype = {
    
  }; // end of prototype
  
  return cls;
})();
  
