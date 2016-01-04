/* toxmodel.js - A kit for querying/manipulating all available models (algorithms)
 *
 * Copyright 2012-2014, IDEAconsult Ltd. http://www.ideaconsult.net/
 * Created by Ivan Georgiev
**/

var jToxModel = (function () {
  var defaultSettings = { // all settings, specific for the kit, with their defaults. These got merged with general (jToxKit) ones.
    shortStars: false,        // whether to show a star and a number (short version) or all maxStars with actual number of them highlighed
    maxStars: 10,             // a total possible number of stars - see above description
    noInterface: false,       // run in interface-less mode - only data retrieval and callback calling.
    selectionHandler: null,   // jToxQuery handler to be attached on each entry's checkbox
    algorithmLink: true,      // when showing algorithms, whether to make it's id a link to an (external) full info page
    algorithms: false,        // ask for algorithms, not models
    forceCreate: false,       // upon creating a model from algorithm - whether to attempt getting a prepared one, or always create it new
    onLoaded: null,           // callback to be called when data has arrived.
    sDom: "<Fif>rt",          // merged to dataTable's settings, when created
    loadOnInit: false,        // whether to make a (blank) request upon loading
    oLanguage: null,          // merged to dataTable's settings, when created
    /* algorithmNeedle */
    /* modelUri */
    configuration: {
      columns : {
        model: {
          'Id': { iOrder: 0, sTitle: "Id", mData: "URI", sWidth: "50px", mRender: function (data, type, full) {
            return (type != 'display') ? full.id : '<a target="_blank" href="' + data + '"><span class="ui-icon ui-icon-link jtox-inline"></span> M' + full.id + '</a>';
          }},
          'Title': { iOrder: 1, sTitle: "Title", mData: "title", sDefaultContent: "-" },
          'Stars': { iOrder: 2, sTitle: "Stars", mData: "stars", sWidth: "160px" },
          'Algorithm': {iOrder: 3, sTitle: "Algorithm", mData: "algorithm" },
          'Info': { iOrder: 4, sTitle: "Info", mData: "trainingDataset", mRender: function (data, type, full) {
            return (type != 'display' || !data) ? data : '<a href="' + data + '"><span class="ui-icon ui-icon-calculator"></span>&nbsp;training set</a>';
          } }
        },
        algorithm: {
          'Id': { iOrder: 0, sTitle: "Id", mData: "uri", sWidth: "150px", mRender: function (data, type, full) {
            return (type != 'display') ? full.id : '<a target="_blank" href="' + data + '"><span class="ui-icon ui-icon-link jtox-inline"></span> ' + full.id + '</a>';
          }},
          'Title': { iOrder: 1, sTitle: "Title", mData: "name", sDefaultContent: "-" },
          'Description': {iOrder: 2, sTitle: "Description", sClass: "shortened", mData: "description", sDefaultContent: '-' },
          'Info': { iOrder: 3, sTitle: "Info", mData: "format", mRender: function (data, type, full) {
            if (type != 'display' || !data)
              return data;
            return  '<strong>' + data + '</strong>; ' +
                    (full.isSupevised ? '<strong>Supervised</strong>; ' : '') +
                    '<a target="_blank" href="' + full.implementationOf + '">' + full.implementationOf + '</a>';
          } }
        }
      }
    }
  };

  var cls = function (root, settings) {
    var self = this;
    self.rootElement = root;
    jT.$(root).addClass('jtox-toolkit'); // to make sure it is there even when manually initialized

    self.settings = jT.$.extend(true, {}, defaultSettings, jT.settings, settings);
    self.models = null;

    if (!self.settings.noInterface) {
      self.rootElement.appendChild(jT.getTemplate('#jtox-model'));
      self.init(settings);
    }

    // finally, wait a bit for everyone to get initialized and make a call, if asked to
    if (self.settings.modelUri != null || self.settings.algorithmNeedle != null || self.settings.loadOnInit)
      self.query();
  };

  cls.prototype = {
    init: function (settings) {
      var self = this;

      // but before given it up - make a small sorting..
      if (!self.settings.algorithms) {
        self.settings.configuration.columns.model.Stars.mRender = function (data, type, full) { return type != 'display' ? data : jT.ui.putStars(self, data, "Model star rating (worst) 1 - 10 (best)"); };
        if (self.settings.shortStars)
          self.settings.configuration.columns.model.Stars.sWidth = "40px";

        self.settings.configuration.columns.model.Algorithm.mRender = function (data, type, full) {
          var name = data.URI.match(/https{0,1}:\/\/.*\/algorithm\/(\w+).*/)[1];
          if (type != 'display')
            return name;
          var res = '<a target="_blank" href="' + data.URI + '">' +
                    '<img src="' + (self.settings.baseUrl || jT.settings.baseUrl) + data.img + '"/>&nbsp;' +
                    name +
                    '</a>';
          if (self.settings.algorithmLink) {
            res += '<a href="' + ccLib.addParameter(self.modelUri, 'algorithm=' + encodeURIComponent(data.URI)) + '"><span class="ui-icon ui-icon-calculator float-right" title="Show models using algorithm ' + name + '"></span></a>';
          }

          return res;
        };
      }

      var cat = self.settings.algorithms ? 'algorithm' : 'model';
      // deal if the selection is chosen
      if (!!self.settings.selectionHandler || !!self.settings.onDetails) {
        jT.ui.putActions(self, self.settings.configuration.columns[cat].Id);
        self.settings.configuration.columns[cat].Id.sWidth = "60px";
      }

      // again , so that changed defaults can be taken into account.
      self.settings.configuration = jT.$.extend(true, self.settings.configuration, settings.configuration);
      if (self.settings.oLanguage == null)
        self.settings.oLanguage = (self.settings.algorithms ? {
          "sLoadingRecords": "No algorithms found.",
          "sZeroRecords": "No algorithms found.",
          "sEmptyTable": "No algorithmss available.",
          "sInfo": "Showing _TOTAL_ algorithm(s) (_START_ to _END_)"
        } : {
          "sLoadingRecords": "No models found.",
          "sZeroRecords": "No models found.",
          "sEmptyTable": "No models available.",
          "sInfo": "Showing _TOTAL_ model(s) (_START_ to _END_)"
        });

      // READYY! Go and prepare THE table.
      self.table = jT.ui.putTable(self, $('table', self.rootElement)[0], cat);
    },

    listModels: function (uri) {
      var self = this;
      if (uri == null)
        uri = self.settings.baseUrl + '/model';
      else if (!self.settings.baseUrl)
        self.settings.baseUrl = jT.grabBaseUrl(uri);

      self.modelUri = uri;
      if (!self.settings.noInterface)
        jT.$(self.table).dataTable().fnClearTable();
      jT.call(self, uri, function (result, jhr) {
        if (!result && jhr.status != 200)
          result = { model: [] }; // empty one

        if (!!result) {
          self.models = result.model;
          ccLib.fireCallback(self.settings.onLoaded, self, result);
          if (!self.settings.noInterface)
            jT.$(self.table).dataTable().fnAddData(result.model);
        }
        else
          ccLib.fireCallback(self.settings.onLoaded, self, result);
      });
    },

    /* List algorithms that contain given 'needle' in their name
    */
    listAlgorithms: function (needle) {
      var self = this;
      var uri = self.settings.baseUrl + '/algorithm';
      if (!!needle)
        uri = ccLib.addParameter(uri, 'search=' + needle);
      if (!self.settings.noInterface)
        jT.$(self.table).dataTable().fnClearTable();
      jT.call(self, uri, function (result, jhr) {
        if (!result && jhr.status != 200)
          result = { algorithm: [] }; // empty one
        if (!!result) {
          self.algorithm = result.algorithm;
          ccLib.fireCallback(self.settings.onLoaded, self, result);
          if (!self.settings.noInterface)
            jT.$(self.table).dataTable().fnAddData(result.algorithm);
        }
        else
          ccLib.fireCallback(self.settings.onLoaded, self, result);
      });
    },

    getModel: function (algoUri, callback) {
      var self = this;
      var createIt = function () {
        jT.service(self, algoUri, { method: 'POST' }, function (result, jhr) {
          ccLib.fireCallback(callback, self, result, jhr);
        });
      };

      if (self.settings.forceCreate)
        createIt();
      else
        jT.call(self, self.settings.baseUrl + '/model?algorithm=' + encodeURIComponent(algoUri), function (result, jhr) {
          if (!result && jhr.status != 404)
            ccLib.fireCallback(callback, self, null, jhr);
          else if (!result || result.model.length == 0)
            createIt();
          else // we have it!
            ccLib.fireCallback(callback, self, result.model[0].URI, jhr);
        });
    },

    runPrediction: function (datasetUri, modelUri, callback) {
      var self = this;
      var q = ccLib.addParameter(datasetUri, 'feature_uris[]=' + encodeURIComponent(modelUri + '/predicted'));

      var createIt = function () {
        jT.service(self, modelUri, { method: "POST", data: { dataset_uri: datasetUri } }, function (result, jhr) {
          if (!result)
            ccLib.fireCallback(callback, self, null, jhr);
          else
            jT.call(self, result, callback);
        });
      };
      jT.call(self, q, function (result, jhr) {
        if (!result)
          ccLib.fireCallback(callback, self, null, jhr);
        else if (!self.settings.forceCreate && result.dataEntry.length > 0) {
          var empty = true;
          for (var i = 0, rl = result.dataEntry.length; i < rl; ++i)
            if (!jT.$.isEmptyObject(result.dataEntry[i].values)) {
              empty = false;
              break;
            }
          if (empty)
            createIt();
          else
            ccLib.fireCallback(callback, self, result, jhr)
        }
        else
          createIt();
      });
    },

    query: function (uri) {
      if (this.settings.algorithms)
        this.listAlgorithms(this.settings.algorithmNeedle = (uri || this.settings.algorithmNeedle));
      else
        this.listModels(this.settings.modelUri = (uri || this.settings.modelUri));
    },

    modifyUri: function (uri) {
      jT.$('input[type="checkbox"]', this.rootElement).each(function () {
        if (this.checked)
          uri = ccLib.addParameter(uri, 'feature_uris[]=' + encodeURIComponent(this.value + '/predicted'));
      })

      return uri;
    }
  };

  return cls;
})();
