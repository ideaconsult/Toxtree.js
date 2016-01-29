/* toxendpoint.js - An endpoint listing and selection toolkit
 *
 * Copyright 2012-2014, IDEAconsult Ltd. http://www.ideaconsult.net/
 * Created by Ivan Georgiev
**/

var jToxEndpoint = (function () {
  var defaultSettings = { // all settings, specific for the kit, with their defaults. These got merged with general (jToxKit) ones.
    selectionHandler: null,   // selection handler to be attached on checkbox, for jToxQuery integration
    noInterface: false,       // run in interface-less mode, with data retrieval and callback calling only
    heightStyle: "content",   // the accordition heightStyle
    hideFilter: false,        // if you don't want to have filter box - just hide it
    maxHits: 10,              // max hits in autocomplete
    showMultiselect: true,    // whether to hide select all / unselect all buttons
    showEditors: false,       // whether to show endpoint value editing fields as details
    showConditions: true,     // whether to show conditions in endpoint field editing
    sDom: "<i>rt",            // passed with dataTable settings upon creation
    oLanguage: null,          // passed with dataTable settings upon creation
    onLoaded: null,           // callback called when the is available
    loadOnInit: false,        // whether to make an (empty) call when initialized.
    units: ['uSv', 'kg', 'mg/l', 'mg/kg bw', '°C', 'mg/kg bw/day', 'ppm', '%', 'h', 'd'],
    loTags: ['>', '>=', '='],
    hiTags: ['<', '<='],
    oLanguage: {
      "sLoadingRecords": "No endpoints found.",
      "sZeroRecords": "No endpoints found.",
      "sEmptyTable": "No endpoints available.",
      "sInfo": "Showing _TOTAL_ endpoint(s) (_START_ to _END_)"
    },
    /* endpointUri */
    configuration: {
      columns : {
        endpoint: {
          'Id': { sTitle: "Id", mData: "uri", bSortable: false, sWidth: "30px", mRender: function (data, type, full) { return ''; } },
          'Name': { sTitle: "Name", mData: "value", sDefaultContent: "-", mRender: function (data, type, full) {
            return data + '<span class="float-right jtox-details">[<span title="Number of values">' + full.count + '</span>]' + jT.ui.putInfo(full.uri) + '</span>';
          } },
        }
      }
    }
  };

  var cls = function (root, settings) {
    var self = this;
    self.rootElement = root;
    jT.$(root).addClass('jtox-toolkit'); // to make sure it is there even when manually initialized

    self.settings = jT.$.extend(true, {}, defaultSettings, jT.settings, settings);

    if (!self.settings.noInterface) {
      self.rootElement.appendChild(jT.getTemplate('#jtox-endpoint'));
      self.init(settings);
    }

    // finally, wait a bit for everyone to get initialized and make a call, if asked to
    if (self.settings.endpointUri != undefined || self.settings.loadOnInit)
      self.loadEndpoints(self.settings.endpointUri)
  };

  // now the editors...
  cls.linkEditors = function (kit, root, settings) { // category, top, onchange, conditions
    // get the configuration so we can setup the fields and their titles according to it
    var config = jT.$.extend(true, {}, kit.settings.configuration.columns["_"], kit.settings.configuration.columns[settings.category]);

    var putAutocomplete = function (box, service, configEntry, options) {
      // if we're not supposed to be visible - hide us.
      var field = box.data('field');
      if (!configEntry || configEntry.bVisible === false) {
        box.hide();
        return null;
      }

      // now deal with the title...
      var t = !!configEntry ? configEntry.sTitle : null;
      if (!!t)
        jT.$('div', box[0]).html(t);

      // prepare the options
      if (!options)
        options = {};

      // finally - configure the autocomplete options themselves to initialize the component itself
      if (!options.source) options.source = function( request, response ) {
        jT.call(kit, service, { method: "GET", data: {
          'category': settings.category,
          'top': settings.top,
          'max': kit.settings.maxHits || defaultSettings.maxHits,
          'search': request.term }
        } , function (data) {
          response( !data ? [] : jT.$.map( data.facet, function( item ) {
            var val = item[field] || '';
            return {
              label: val + (!item.count ? '' : " [" + item.count + "]"),
              value: val
            }
          }));
        });
      };

      // and the change functon
      if (!options.change) options.change = function (e, ui) {
        settings.onchange.call(this, e, field, !ui.item ? ccLib.trim(this.value) : ui.item.value);
      };

      // and the final parameter
      if (!options.minLength) options.minLength = 0;

      return jT.$('input', box[0]).autocomplete(options);
    };

    var putValueComplete = function (root, configEntry) {
      var field = root.data('field');
      var extractLast = function( val ) { return !!val ? val.split( /[,\(\)\s]*/ ).pop() : val; };
      var parseValue = function ( text ) {
        var obj = {};
        var parsers = [
          {
            regex: /^[\s=]*([\(\[])\s*(\-?\d*[\.eE]?\-?\d*)\s*,\s*(\-?\d*[\.eE]?\-?\d*)\s*([\)\]])\s*([^\d,]*)\s*$/,
            fields: ['', 'loQualifier', 'loValue', 'upValue', 'upQualifier', 'unit'],
            // adjust the parsed value, if needed
            adjust: function (obj, parse) {
              if (!obj.upValue) delete obj.upQualifier;
              else              obj.upQualifier = parse[4] == ']' ? '<=' : '<';

              if (!obj.loValue) delete obj.loQualifier;
              else              obj.loQualifier = parse[1] == '[' ? '>=' : '>';
            }
          },
          {
            regex: /^\s*(>|>=)?\s*(\-?\d+[\.eE]?\-?\d*)\s*([^\d,<=>]*)[,\s]+(<|<=)?\s*(\-?\d*[\.eE]?\-?\d*)\s*([^\d,<=>]*)\s*$/,
            fields: ['', 'loQualifier', 'loValue', 'unit', 'upQualifier', 'upValue', 'unit'],
          },
          {
            regex: /^\s*(>|>=|=)?\s*(\-?\d+[\.eE]?\-?\d*)\s*([^\d,<=>]*)\s*$/,
            fields: ['', 'loQualifier', 'loValue', 'unit'],
            adjust: function (obj, parse) { if (!obj.loQualifier) obj.loQualifier = '='; }
          },
          {
            regex: /^\s*(<|<=)\s*(\-?\d+[\.eE]?\-?\d*)\s*([^\d,<=>]*)\s*$/,
            fields: ['', 'upQualifier', 'upValue', 'unit'],
          },
          {
            regex: /^\s*(\-?\d+[\.eE]?\-?\d*)\s*(<|<=)\s*([^\d,<=>]*)\s*$/,
            fields: ['', 'upValue', 'upQualifier', 'unit'],
          },
          {
            regex: /^\s*(\-?\d+[\.eE]?\-?\d*)\s*(>|>=)\s*([^\d,<=>]*)\s*$/,
            fields: ['', 'loValue', 'loQualifier', 'unit'],
          }
        ];

        for (var pi = 0;pi < parsers.length; ++pi) {
          var parse = text.match(parsers[pi].regex);
          if (!parse)
            continue;
          for (var i = 1;i < parse.length; ++i)
            if (!!parse[i]) {
              var f = parsers[pi].fields[i];
              obj[f] = parse[i];
            }

          if (parsers[pi].adjust)
            parsers[pi].adjust(obj, parse);
          if (!!obj.unit) obj.unit = obj.unit.trim();
          break;
        }

        if (pi >= parsers.length)
          obj.textValue = ccLib.trim(text);

        return obj;
      };

      var allTags = [].concat(kit.settings.loTags || defaultSettings.loTags, kit.settings.hiTags || defaultSettings.hiTags, kit.settings.units || defaultSettings.units);

      var autoEl = putAutocomplete(root, null, configEntry, {
        change: function (e, ui) {
          settings.onchange.call(this, e, field, parseValue(this.value));
        },
        source: function( request, response ) {
          // delegate back to autocomplete, but extract the last term
          response( jT.$.ui.autocomplete.filter( allTags, extractLast(request.term)));
        },
        focus: function() { // prevent value inserted on focus
          return false;
        },
        select: function( event, ui ) {
          var theVal = this.value,
              last = extractLast(theVal);

          this.value = theVal.substr(0, theVal.length - last.length) + ui.item.value + ' ';
          return false;
        }
      });

      // it might be a hidden one - so, take care for this
      if (!!autoEl) autoEl.bind('keydown', function (event) {
        if ( event.keyCode === jT.$.ui.keyCode.TAB && !!autoEl.menu.active )
          event.preventDefault();
      });
    };

    // deal with endpoint name itself
    putAutocomplete(jT.$('div.box-endpoint', root), '/query/experiment_endpoints', ccLib.getJsonValue(config, 'effects.endpoint'));
    putAutocomplete(jT.$('div.box-interpretation', root), '/query/interpretation_result', ccLib.getJsonValue(config, 'interpretation.result'));

    jT.$('.box-conditions', root).hide(); // to optimize process with adding children
    if (!!settings.conditions) {
      // now put some conditions...
      var any = false;
      var condRoot = jT.$('div.box-conditions .jtox-border-box', root)[0];
      for (var cond in config.conditions) {
        any = true;
        var div = jT.getTemplate('#jtox-endcondition');
        jT.$(div).attr('data-field', cond);
        condRoot.appendChild(div);
        ccLib.fillTree(div, { title: config.conditions[cond].sTitle || cond });
        jT.$('input', div).attr('placeholder', "Enter value or range");
        putValueComplete(jT.$(div), config.conditions[cond]);
      }
      if (any)
        jT.$('.box-conditions', root).show();
    }

    // now comes the value editing mechanism
    var confRange = ccLib.getJsonValue(config, 'effects.result') || {};
    var confText = ccLib.getJsonValue(config, 'effects.text') || {};
    putValueComplete(jT.$('.box-value', root), confRange.bVisible === false ? confText : confRange);

    // now initialize other fields, marked with box-field
    jT.$('.box-field', root).each(function () {
      var name = jT.$(this).data('name');
      jT.$('input, textarea, select', this).on('change', function (e) {
        settings.onchange.call(this, e, name, jT.$(this).val());
      });
    });
  };

  cls.prototype = {
    init: function (settings) {
      var self = this;

      // we can redefine onDetails only if there is not one passed and we're asked to show editors at ll
      if (!!self.settings.showEditors && !self.settings.onDetails) {
        self.edittedValues = {};
        self.settings.onDetails = function (root, data, element) {
          self.edittedValues[data.endpoint] = {};
          cls.linkEditors(self, root.appendChild(jT.getTemplate('#jtox-endeditor')), {
            category: data.endpoint,
            top: data.subcategory,
            conditions: self.settings.showConditions,
            onchange: function (e, field, value) { ccLib.setJsonValue(self.edittedValues[data.endpoint], field, value); }
          });
        };
      }

      // deal if the selection is chosen
      if (!!self.settings.selectionHandler || !!self.settings.onDetails)
        jT.ui.putActions(self, self.settings.configuration.columns.endpoint.Id);

      self.settings.configuration.columns.endpoint.Id.sTitle = '';

      // again , so that changed defaults can be taken into account.
      self.settings.configuration = jT.$.extend(true, self.settings.configuration, settings.configuration);
      var cols = jT.ui.processColumns(self, 'endpoint');

      // make the accordition now...
    	jT.$('.jtox-categories', self.rootElement).accordion( {
    		heightStyle: self.settings.heightStyle
    	});

      self.tables = { };
      // and now - initialize all the tables...
      jT.$('table', self.rootElement).each(function () {
        var name = this.className;
        self.tables[name] = jT.ui.putTable(self, this, "endpoint", {
          "aoColumns": cols,
          "fnInfoCallback": self.updateStats(name),
          "aaSortingFixed": [[1, 'asc']],
          "onRow": function (nRow, aData, iDataIndex) {
            jT.$(nRow).addClass(aData.endpoint);
          }
        });
      });

      if (!!self.settings.hideFilter)
        jT.$('.filter-box', self.rootElement).remove();
      else {
        var filterTimeout = null;
        var fFilter = function (ev) {
          if (!!filterTimeout)
            clearTimeout(filterTimeout);

          var field = ev.currentTarget;

          filterTimeout = setTimeout(function() {
            jT.$('table', self.rootElement).each(function () {
              jT.$(this).dataTable().fnFilter(field.value);
            });
          }, 300);
        };

        jT.$('.filter-box input', self.rootElement).on('keydown', fFilter);
      }

      if (!self.settings.showMultiselect || !self.settings.selectionHandler)
        jT.$('h3 a', self.rootElement).remove();
      else
        jT.ui.installMultiSelect(self.rootElement, null, function (el) { return el.parentNode.parentNode.nextElementSibling; });
    },

    getValues: function (needle) {
      var self = this;

      var filter = null;
      if (!needle)
        filter = function (end) { return true; };
      else if (typeof needle != 'function')
        filter = function (end) { return end.indexOf(needle) >= 0; };
      else
        filter = needle;

      for (var endpoint in self.edittedValues) {
        if (filter(endpoint))
          return self.edittedValues[endpoint];
      }
      return null;
    },

    updateStats: function (name) {
      var self = this;
      return function( oSettings, iStart, iEnd, iMax, iTotal, sPre ) {
        var head = jT.$('h3.' + name, self.rootElement)[0];
        // now make the summary...
        var html = '';
        if (iTotal > 0) {
          var count = 0;
          var data = this.fnGetData();
          for (var i = iStart; i <= iEnd && i < iMax; ++i)
            count += data[i].count;
          html = "[" + count + "]";
        }
        else
          html = '';

        jT.$('div.jtox-details span', head).html(html);
        return sPre;
      }
    },

    fillEntries: function (facet) {
      var self = this;
      // first we need to group them and extract some summaries
      var ends = { };
      for (var i = 0, fl = facet.length; i < fl; ++i) {
        var entry = facet[i];
        var cat = ends[entry.subcategory];
        if (cat == null)
          ends[entry.subcategory] = cat = [];

        cat.push(entry);
      }

      // now, as we're ready - go and fill everything
      jT.$('h3', self.rootElement).each(function () {
        var name = jT.$(this).data('cat');
        var table = self.tables[name];
        table.fnClearTable();

        var cat = ends[name.replace("_", " ")];
        if (cat != null)
          table.fnAddData(cat);
      });
    },

    loadEndpoints: function (uri) {
      var self = this;
      if (uri == null)
        uri = self.settings.baseUrl + '/query/study';
      else if (!self.settings.baseUrl)
        self.settings.baseUrl = jT.grabBaseUrl(uri);

      // make the call...
      jT.call(self, uri, function (result, jhr) {
        if (!result && jhr.status != 200)
          result = { facet: [] }; // empty one
        if (!!result) {
          self.summary = result.facet;
          ccLib.fireCallback(self.settings.onLoaded, self, result);
          if (!self.settings.noInterface)
            self.fillEntries(result.facet);
        }
        else {
          self.facet = null;
          ccLib.fireCallback(self.settings.onLoaded, self, result);
        }
      });
    },

    query: function (uri) {
      this.loadEndpoints(uri);
    },

    modifyUri: function (uri) {
      jT.$('input[type="checkbox"]', this.rootElement).each(function () {
        if (this.checked)
          uri = ccLib.addParameter(uri, 'feature_uris[]=' + encodeURIComponent(this.value + '/feature'));
      })

      return uri;
    }
  };

  return cls;
})();
