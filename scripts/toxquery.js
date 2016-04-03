/* toxquery.js - Universal query widget, that can work with any kit (study or compound) inside
 *
 * Copyright 2012-2014, IDEAconsult Ltd. http://www.ideaconsult.net/
 * Created by Ivan Georgiev
**/

var jToxQuery = (function () {
  var defaultSettings = { // all settings, specific for the kit, with their defaults. These got merged with general (jToxKit) ones.
    scanDom: true,          // whether to scan the whole DOM for finding the main query kit
    initialQuery: false,    // whether to perform an initial query, immediatly when loaded.
    kitSelector: null,      // selector for the main kit, if outside, for example.
    dom: null,              // an, all-prepared object with all sub-kits. Structure { kit: <main kit object>, widgets: { <kit type>: <widget kit object> } }

    configuration: {
      // this is the main thing to be configured
      handlers: {
        query: function (e, query) { jT.parentKit(jToxQuery, this).query(); },
      }
    }
  };

  var cls = function (root, settings) {
    var self = this;
    self.rootElement = root;
    jT.$(root).addClass('jtox-toolkit'); // to make sure it is there even when manually initialized

    self.settings = jT.$.extend(true, {}, defaultSettings, jT.settings, settings);
    self.mainKit = null;

    if (self.settings.scanDom && !self.settings.dom) {
      self.settings.dom = { kit: null, widgets: { } };
      jT.$('.jtox-toolkit', self.rootElement).each(function () {
        if (jT.$(this).hasClass('jtox-widget'))
          self.settings.dom.widgets[jT.$(this).data('kit')] = this;
        else
          self.settings.dom.kit = this;
      });
    }

    if (!!self.settings.kitSelector)
      self.settings.dom.kit = jT.$(self.settings.kitSelector)[0];

    // finally, wait a bit for everyone to get initialized and make a call, if asked to
    if (!!self.settings.initialQuery)
      self.initialQueryTimer = setTimeout(function () { self.query(); }, 200);
  };

  cls.prototype.widget = function (name) {
    return this.settings.dom.widgets[name];
  };

  cls.prototype.kit = function () {
    if (!this.mainKit)
      this.mainKit = jT.kit(this.settings.dom.kit);

    return this.mainKit;
  };

  cls.prototype.setWidget = function (id, dom) {
    this.settings.dom.widgets[id] = dom;
  };

  cls.prototype.cancelInitialQuery = function () {
    if (!!this.initialQueryTimer)
      clearTimeout(this.initialQueryTimer);
  };

  /* Perform the actual query, traversing all the widgets and asking them to
  alter the given URL, then - makes the call */
  cls.prototype.query = function () {
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
  }; 
  // end of prototype

  return cls;
})();

/* Now comes the jToxSearch component, which implements the compound searching block
*/
var jToxSearch = (function () {
  var defaultSettings = { // all settings, specific for the kit, with their defaults. These got merged with general (jToxKit) ones.
    defaultNeedle: '50-00-0',     // which is the default search string, if empty one is provided
    smartsList: 'funcgroups',     // which global JS variable to seek for smartsList
    hideOptions: '',              // comma separated list of search options to hide
    slideInput: false,            // whether to slide the input, when focussed
    contextUri: null,             // a search limitting contextUri - added as dataset_uri parameter
    configuration: {
      handlers: { }
    }
  };

  var queries = {
    'auto': "/query/compound/search/all",
    'uri': "/query/compound/url/all",
    'similarity': "/query/similarity",
    'smarts': "/query/smarts"
  };

  var cls = function (root, settings) {
    var self = this;
    self.rootElement = root;
    jT.$(root).addClass('jtox-toolkit'); // to make sure it is there even when manually initialized

    self.settings = jT.$.extend(true, {}, defaultSettings, jT.settings, settings);
    self.rootElement.appendChild(jT.getTemplate('#jtox-search'));
    self.queryKit = jT.parentKit(jToxQuery, self.rootElement);

    self.search = { mol: "", type: "", queryType: "auto"};

    var form = jT.$('form', self.rootElement)[0];
    form.onsubmit = function () { return false; }

    // go for buttonset preparation, starting with hiding / removing passed ones
    if (!!self.settings.hideOptions) {
      var hideArr = self.settings.hideOptions.split(',');
      for (var i = 0; i < hideArr.length; ++i) {
        jT.$('#search' + hideArr[i], self.rootElement).remove();
        jT.$('label[for="search' + hideArr[i] + '"]', self.rootElement).remove();
      }
    }

    if (!!form.searchcontext) {
      form.searchcontext.value = self.settings.contextUri;
      $(form.searchcontext).on('change', function (e) {
        self.settings.contextUri = this.value;
      });
    }

    // when we change the value here - all, possible MOL caches should be cleared.
    jT.$(form.searchbox).on('change', function () {
      self.setAuto();
    });

    if (self.settings.slideInput)
      jT.$(form.searchbox)
      .on('focus', function () {
        var gap = jT.$(form).width() - jT.$(radios).width() - 30 - jT.$('.search-pane').width();
        var oldSize = $(this).data('oldSize') || $(this).width();
        $(this).data('oldSize', oldSize);
        jT.$(this).css('width', '' + (oldSize + gap) + 'px');
      })
      .on('blur', function () {
        jT.$(this).css('width', '');
      });

    var hasAutocomplete = false;
    if (jT.$('#searchuri', self.rootElement).length > 0) {
      hasAutocomplete = true;
      jT.$(form.searchbox).autocomplete({
        minLength: 2,
        open: function() { jT.$( this ).removeClass( "ui-corner-all" ).addClass( "ui-corner-top" ); },
        close: function() { jT.$( this ).removeClass( "ui-corner-top" ).addClass( "ui-corner-all" ); },
        source: function (request, response) {
          jT.call(self, '/dataset?search=^' + request.term, function (result) {
            response(!result ? [] : $.map( result.dataset, function( item ) {
              var pos =  item.URI.lastIndexOf("/"),
                  shortURI = (pos >= 0) ? "D" + item.URI.substring(pos+1) + ": " : "";
              return {
                label: shortURI + item.title,
                value: item.URI
              };
            }));
          });
        }
      });
    }

    var radios = jT.$('.jq-buttonset', root).buttonset();
    var onTypeClicked = function () {
      form.searchbox.placeholder = jT.$(this).data('placeholder');
      jT.$('.search-pane .auto-hide', self.rootElement).addClass('hidden');
      jT.$('.search-pane .' + this.id, self.rootElement).removeClass('hidden');
      self.search.queryType = this.value;
      if (this.value == 'uri') {
        jT.$(form.drawbutton).addClass('hidden');
        if (hasAutocomplete)
          jT.$(form.searchbox).autocomplete('enable');
      }
      else {
        jT.$(form.drawbutton).removeClass('hidden');
        if (hasAutocomplete)
          jT.$(form.searchbox).autocomplete('disable');
      }
    };

    jT.$('.jq-buttonset input', root).on('change', onTypeClicked);

    var typeEl = jT.$('#search' + self.settings.option, root)[0];
    if (typeEl != null)
      jT.$(typeEl).trigger('click');
    else
      ccLib.fireCallback(onTypeClicked, jT.$('.jq-buttonset input', root)[0])

    // spend some time to setup the SMARTS groups
    if (!!window[self.settings.smartsList]) {
      var list = window[self.settings.smartsList];
      var familyList = [];
      var familyIdx = {};

      for (var i = 0, sl = list.length; i < sl; ++i) {
        var entry = list[i];
        if (familyIdx[entry.family] === undefined) {
          familyIdx[entry.family] = familyList.length;
          familyList.push([]);
        }

        familyList[familyIdx[entry.family]].push(entry);
      }

      // now we can iterate over them
      var df = document.createDocumentFragment();
      for (fi = 0, fl = familyList.length; fi < fl; ++fi) {
        var grp = document.createElement('optgroup');
        grp.label = familyList[fi][0].family;

        for (i = 0, el = familyList[fi].length; i < el; ++i) {
          var e = familyList[fi][i];
          var opt = document.createElement('option');
          opt.innerHTML = e.name;
          opt.value = e.smarts;
          if (!!e.hint)
            jT.$(opt).attr('data-hint', e.hint);
          grp.appendChild(opt);
        }
        df.appendChild(grp);
      }

      // now it's time to add all this and make the expected behavior
      form.smarts.appendChild(df);
      form.smarts.firstElementChild.checked = true;

      jT.$(form.smarts).on('change', function () {
        var hint = jT.$(this[this.selectedIndex]).data('hint');
        form.smarts.title = (!!hint ? hint : '');
        self.setAuto(this.value);
      });
    }

    // Now, deal with KETCHER - make it show, attach handlers to/from it, and handlers for showing/hiding it.
    var ketcherBox = jT.$('.ketcher', root)[0];
    var ketcherReady = false;
    var onKetcher = function (service, method, async, parameters, onready) {
      if (service == "knocknock")
        onready("You are welcome!", null);
      else
        jT.call(self.queryKit.kit(), '/ui/' + service, {dataType: "text", data: parameters}, function (res, jhr) { onready(res, jhr); });
    };

    var ensureKetcher = function () {
      if (!ketcherReady) {
        jT.insertTool('ketcher', ketcherBox);
        ketcher.init({ root: ketcherBox, ajaxRequest: onKetcher });

        var emptySpace = jT.$('.toolEmptyCell', ketcherBox)[0];
        jT.$(emptySpace.appendChild(jT.getTemplate('#ketcher-usebutton'))).on('click', function () {
          var smiles = ketcher.getSmiles();
          var mol = ketcher.getMolfile();
          self.setMol(mol);
          if (!!smiles)
            form.searchbox.value = smiles;
        });
        jT.$(emptySpace.appendChild(jT.getTemplate('#ketcher-drawbutton'))).on('click', function () {
          ketcher.setMolecule(self.search.mol || form.searchbox.value);
        });
        ketcherReady = true;
      }
    };

    jT.$(form.drawbutton).on('click', function () {
      if (jT.$(ketcherBox).hasClass('shrinken')) {
        ensureKetcher();
        jT.$(ketcherBox).css('display', '');
      }
      else
        setTimeout(function () { jT.$(ketcherBox).css('display', 'none'); }, 500);

      setTimeout(function () { jT.$(ketcherBox).toggleClass('shrinken') }, 50);
    });

    // finally - parse the URL-passed parameters and setup the values appropriately.
    var doQuery = false;
    if (!!self.settings.b64search) {
      self.setMol($.base64.decode(self.settings.b64search));
      doQuery = true;
    }
    else if (!!self.settings.search) {
      self.setAuto(self.settings.search);
      doQuery = true;
    }

    jT.ui.installHandlers(self);
    if (doQuery) {
      self.queryKit.cancelInitialQuery();
      setTimeout(function () { self.queryKit.query(); }, 250);
    }
    // and very finally - install the handlers...
  };

  // required from jToxQuery - this is how we add what we've collected
  cls.prototype.modifyUri = function (uri) {
    var form = jT.$('form', this.rootElement)[0];
    var params = { type: this.search.type };
    var type = this.search.queryType;

    if (type == "auto" && params.type == 'auto' && form.searchbox.value.indexOf('http') == 0)
      type = "uri";

    var res = queries[type] + (uri.indexOf('?') > -1 ? '' : '?') + uri;

    if (!!this.search.mol) {
      params.b64search = $.base64.encode(this.search.mol);
    }
    else {
      params.search = form.searchbox.value;
      if (!params.search)
        params.search = this.settings.defaultNeedle;
        this.setAuto(params.search);
    }

    if (type == "auto" && form.regexp.checked) {
      params['condition'] = "regexp";
    }
    if (type == 'similarity') {
      params.threshold = form.threshold.value;
    }

    if (type == 'similarity') {
      params.filterBySubstance = form.similaritybysubstance.checked;
    }
    if (type == 'smarts') {
      params.filterBySubstance = form.smartsbysubstance.checked;
    }

    if (!!this.settings.contextUri)
      params['dataset_uri'] = this.settings.contextUri;

    return ccLib.addParameter(res, $.param(params));
  };

  // some shortcuts for outer world.
  cls.prototype.makeQuery = function (needle) {
    if (!!needle)
      this.setAuto(needle);
    this.queryKit.query();
  },

  cls.prototype.getNeedle = function () {
    return this.search.type == 'mol' ? this.search.mol : jT.$('form', this.rootElement)[0].searchbox.value;
  };

  cls.prototype.setAuto = function (needle) {
    this.search.mol = null;
    this.search.type = 'auto';

    var box = jT.$('form', this.rootElement)[0].searchbox;
    if (!!this.search.oldplace)
      box.placeholder = this.search.oldplace;
    if (needle != null)
      box.value = needle;
  };

  cls.prototype.setMol = function (mol) {
    var box = jT.$('form', this.rootElement)[0].searchbox;
    this.search.mol = mol;
    this.search.type = 'mol';
    this.search.oldplace = box.placeholder;

    box.placeholder = "MOL formula saved_";
    box.value = '';
  }; 
  // end of prototype

  return cls;
})();
