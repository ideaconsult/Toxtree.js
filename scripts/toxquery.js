/* toxquery.js - Universal query widget, that can work with any kit (study or dataset) inside
 *
 * Copyright 2012-2014, IDEAconsult Ltd. http://www.ideaconsult.net/
 * Created by Ivan Georgiev
**/

var jToxQuery = (function () {
  var defaultSettings = { // all settings, specific for the kit, with their defaults. These got merged with general (jToxKit) ones.
    autoInitialize: true,
    dom: {
      kit: null, // ... here.
      widgets: {},
    },

    configuration: {
      // this is the main thing to be configured
      handlers: { }
    }
  };
  
  var cls = function (root, settings) {
    var self = this;
    self.rootElement = root;
    self.handlers = {};
    jT.$(root).addClass('jtox-toolkit'); // to make sure it is there even when manually initialized
    
    self.settings = jT.$.extend(true, {}, defaultSettings, jT.settings, settings);
    self.mainKit = null;
    
    jT.$('.jtox-handler', root)
    .on('change', function (e) {
      var handler = self.settings.configuration.handlers[jT.$(this).data('handler')];
      if (!!handler)
        ccLib.fireCallback(handler, this, this, self);
      else
        console.log("jToxError: referring unknown handler: " + jT.$(this).data('handler'));
    })
    .each(function() {
      self.handlers[jT.$(this).data('handler')] = this;
    });
    
    if (!self.settings.autoInitialize)
      return;
      
    jT.$('.jtox-toolkit', self.rootElement).each(function () {
      if (jT.$(this).hasClass('jtox-widget'))
        self.settings.dom.widgets[jT.$(this).data('kit')] = this;
      else 
        self.settings.dom.kit = this;
    });
  };
  
  cls.prototype = {
    element: function (handler) {
      return this.handlers[handler];
    },
    
    widget: function (name) {
      return this.settings.dom.widgets[name];
    },
    
    kit: function () {
      if (!this.mainKit)
        self.mainKit = jT.kit(this);
        
      return this.mainKit;
    },
  }; // end of prototype
  
  return cls;
})();
