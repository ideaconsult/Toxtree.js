/* toxquery.js - Universal query widget, that can work with any kit (study or dataset) inside
 *
 * Copyright 2012-2014, IDEAconsult Ltd. http://www.ideaconsult.net/
 * Created by Ivan Georgiev
**/

var jToxQuery = (function () {
  var defaultSettings = { // all settings, specific for the kit, with their defaults. These got merged with general (jToxKit) ones.
    scanDom: true,
    dom: {
      kit: null, // ... here.
      widgets: {},
    },

    configuration: {
      // this is the main thing to be configured
      handlers: { 
        query: function (el, query) { query.query(); },
      }
    }
  };
  
  var cls = function (root, settings) {
    var self = this;
    self.rootElement = root;
    self.handlers = {};
    jT.$(root).addClass('jtox-toolkit'); // to make sure it is there even when manually initialized
    
    self.settings = jT.$.extend(true, {}, defaultSettings, jT.settings, settings);
    self.mainKit = null;
        
    if (self.settings.scanDom) {
      jT.$('.jtox-toolkit', self.rootElement).each(function () {
        if (jT.$(this).hasClass('jtox-widget'))
          self.settings.dom.widgets[jT.$(this).data('kit')] = this;
        else 
          self.settings.dom.kit = this;
      });
    }

    self.initHandlers(root);
    // finally, wait a bit for everyone to get initialized and make a call, if asked to
    if (!ccLib.isNull(self.settings.initialQuery))
      setTimeout(function () { self.query(); }, 200);
  };
  
  cls.prototype = {
    addHandlers: function (handlers) {
      self.settings.configuration.handlers = jT.$.extend(self.settings.configuration.handlers, handlers);
    },
    
    element: function (handler) {
      return this.handlers[handler];
    },
    
    widget: function (name) {
      return this.settings.dom.widgets[name];
    },
    
    kit: function () {
      if (!this.mainKit)
        this.mainKit = jT.kit(this.settings.dom.kit);
        
      return this.mainKit;
    },
    
    initHandlers: function (root) {
      var self = this;
      var fireHandler = function (e) {
        var handler = self.settings.configuration.handlers[jT.$(this).data('handler')];
        if (!!handler)
          ccLib.fireCallback(handler, this, this, self);
        else
          console.log("jToxError: referring unknown handler: " + jT.$(this).data('handler'));
      };
      
      jT.$('.jtox-handler', root)
      .on('change', fireHandler)
      .each(function() {
        self.handlers[jT.$(this).data('handler')] = this;
      });
  
      jT.$('button.jtox-handler', root).on('click', fireHandler);
    },
    
    /* Perform the actual query, traversing all the widgets and asking them to
    alter the given URL, then - makes the call */
    query: function () {
      var uri = this.settings.service || '';
      for (var w in this.settings.dom.widgets) {
        var widget = jT.kit(this.settings.dom.widgets[w]);
        if (!widget) 
          console.log("jToxError: the widget [" + w + "] is not recognized: ignored");
        else if (!widget['modifyUri'])
          console.log("jToxError: the widget [" + w + "] doesn't have 'modifyUri' method: ignored");
        else
          uri = widget.modifyUri(uri);
      }
      
      if (!!uri)
        this.kit().query(uri);
    }
  }; // end of prototype
  
  cls.queryKit = function(element) {
    var query = null;
    jT.$(element).parents().each(function() {
      var kit = jT.kit(this);
      if (!kit)
        return;
      if (kit instanceof jToxQuery)
        query = kit;
    });
    
    return query;
  };
  
  return cls;
})();

/* Now comes the jToxSearch component, which implements the compound searching block
*/
var jToxSearch = (function () {
  var defaultSettings = { // all settings, specific for the kit, with their defaults. These got merged with general (jToxKit) ones.
    defaultSmiles: '50-00-0',
    configuration: {
      handlers: {
        onKetcher: function (service, method, async, parameters, onready) {
          if (service == "knocknock")
            onready("You are welcome!", null);
          else
            jT.call(null, 'molecules/' + service, parameters, function (res, jhr) { onready(res, jhr); });
        }
      }
    }
  };
  
  var queries = {
    'auto': "/query/compound/search/all",
    'similarity': "/query/similarity",
    'smarts': "/query/smarts"
  };
  
  var cls = function (root, settings) {
    var self = this;
    self.rootElement = root;
    jT.$(root).addClass('jtox-toolkit'); // to make sure it is there even when manually initialized
    
    self.settings = jT.$.extend({}, defaultSettings, jT.settings, settings);
    self.rootElement.appendChild(jT.getTemplate('#jtox-search'));
    self.queryKit = jToxQuery.queryKit(self.rootElement);
    self.queryKit.initHandlers(root);
    
    self.search = { mol: "", type: ""};
    
    var form = jT.$('form', self.rootElement)[0];
    form.onsubmit = function () { return false; }

    var radios = jT.$('.jq-buttonset', root).buttonset();
    var onTypeClicked = function () {
      form.searchbox.placeholder = jT.$(this).data('placeholder');
      jT.$('.search-pane .dynamic').addClass('hidden');
      jT.$('.search-pane .' + this.id).removeClass('hidden');
      self.search.type = this.value;
    };
    
    jT.$('.jq-buttonset input', root).on('change', onTypeClicked);
    ccLib.fireCallback(onTypeClicked, jT.$('.jq-buttonset input', root)[0]);
    
    jT.$(form.searchbox)
    .on('focus', function () {
      var gap = jT.$(form).width() - jT.$(radios).width() - 30 - jT.$('.search-pane').width();
      var oldSize = $(this).width();
      jT.$(this).css('width', '' + (oldSize + gap) + 'px');
    })
    .on('blur', function () {
      jT.$(this).css('width', '');
    }).
    on('change', function () { // when we change the value here - all, possible MOL caches should be cleared.
      self.search.mol = null;
      self.search.type = "auto";
    });
    
    // Now, deal with KETCHER - make it show, attach handlers to/from it, and handlers for showing/hiding it.
    var ketcherBox = jT.$('.ketcher', root)[0];
    var ketcherReady = false;
    var onKetcher = function (service, method, async, parameters, onready) {
      if (service == "knocknock")
        onready("You are welcome!", null);
      else
        jT.call(self.queryKit.kit(), 'ui/' + service, {dataType: "text", data: parameters}, function (res, jhr) { onready(res, jhr); });
    };
    
    var ensureKetcher = function () {
      if (!ketcherReady) {
        jT.insertTool('ketcher', ketcherBox);
        ketcher.init({ root: ketcherBox, ajaxRequest: onKetcher });
        
        var emptySpace = jT.$('.toolEmptyCell', ketcherBox)[0];
        jT.$(emptySpace.appendChild(jT.getTemplate('#ketcher-usebutton'))).on('click', function () {
          var smiles = ketcher.getSmiles();
          var mol = ketcher.getMolfile();
          if (!mol) {
            console.log("jToxError: attempt to submit empty molecule");
          }
          else {
            form.searchbox.value = smiles;
            self.search.mol = mol;
            self.search.type = "mol;"
          }
        });
        jT.$(emptySpace.appendChild(jT.getTemplate('#ketcher-drawbutton'))).on('click', function () {
          ketcher.setMolecule(form.searchbox.value);
        });
        ketcherReady = true;
      }
      
      // finally - parse the URL-passed parameters and setup the values appropriately.
    };
    
    jT.$(form.drawbutton).on('click', function () { 
      if (jT.$(ketcherBox).hasClass('shrinken')) {
        ensureKetcher();
        jT.$(ketcherBox).css('display', '');
      }
      else
        setTimeout(function () { jT.$(ketcherBox).css('display', 'none'); }, 500);

      setTimeout(function () { jT.$(ketcherBox).toggleClass('shrinken') }, 100);
    });
  };
  
  cls.prototype = {
    // required from jToxQuery - this is how we add what we've collected
    modifyUri: function (uri) {
      var form = jT.$('form', this.rootElement)[0];
    
      var type = jT.$('input[name="searchtype"]:checked', form).val();
      
      var res = queries[type] + (uri.indexOf('?') > -1 ? '' : '?') + uri;
      var params = { };

      if (!!this.search.url) {
        params.type = 'url';
        params.search = encodeURI(this.search.url);
      }
      else if (!!this.search.mol) {
        params.b64search = $.base64.encode(this.search.mol);
        params.type = 'mol';
      }
      else {
        params.search = form.searchbox.value;
        params.type = "smiles";
        if (!params.search)
          params.search = this.settings.defaultSmiles;
      }
        
      if (type == 'similarity')
        params.threshold = form.threshold.value;
      
      return ccLib.addParameter(res, $.param(params));
    },
    
    // some shortcuts for outer world.
    makeQuery: function (needle) {
      if (!!needle) 
        this.setNeedle(needle);
      this.queryKit.query();
    },
    
    setNeedle: function (needle) {
      if (!!needle)
        console.log("jToxError: Trying to set null needle");
      else {
        this.search.mol = null;
        this.search.type = "auto";
        jT.$('form', this.rootElement)[0].searchbox.value = needle;
      }
    },
    
    getNeedle: function () {
      return jT.$('form', this.rootElement)[0].searchbox.value;
    }
  }; // end of prototype
  
  return cls;
})();
