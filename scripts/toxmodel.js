/* toxmodel.js - A kit for querying/manipulating all available models (algorithms)
 *
 * Copyright 2012-2014, IDEAconsult Ltd. http://www.ideaconsult.net/
 * Created by Ivan Georgiev
**/

var jToxModel = (function () {
  var defaultSettings = { // all settings, specific for the kit, with their defaults. These got merged with general (jToxKit) ones.
    selectionHandler: null,
    maxStars: 10,
    algorithmLink: true,
    algorithms: false,
    onLoaded: null,
    sDom: "<Fif>rt",
    loadOnInit: false,
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
    
    self.rootElement.appendChild(jT.getTemplate('#jtox-model'));
    self.init();
        
    // finally, wait a bit for everyone to get initialized and make a call, if asked to
    if (self.settings.modelUri !== undefined || self.settings.algorithmNeedle !== undefined || self.settings.loadOnInit)
      self.query();
  };
  
  cls.prototype = {
    init: function () {
      var self = this;
      
      // but before given it up - make a small sorting..
      if (!self.settings.algorithms) {
        self.settings.configuration.columns.model.Stars.mRender = function (data, type, full) { return type != 'display' ? data : jT.ui.putStars(self, data, "Model star rating (worst) 1 - 10 (best)"); };
        if (self.settings.shortStars) {
          self.settings.configuration.columns.model.Stars.sWidth = "40px";
        }

        self.settings.configuration.columns.model.Algorithm.mRender = function (data, type, full) { 
          var name = data.URI.match(/http:\/\/.*\/algorithm\/(\w+).*/)[1];
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
        jT.ui.putActions(self, self.settings.configuration.columns[cat].Id, { selection: self.settings.selectionHandler, details: !!self.settings.onDetails});
        self.settings.configuration.columns[cat].Id.sWidth = "60px";
      }
      
      // READYY! Go and prepare THE table.
      self.table = jT.$('table', self.rootElement).dataTable({
        "bPaginate": false,
        "bLengthChange": false,
				"bAutoWidth": false,
        "sDom" : self.settings.sDom,
        "aoColumns": jT.ui.processColumns(self, cat),
				"oLanguage": {
          "sLoadingRecords": "No models found.",
          "sZeroRecords": "No models found.",
          "sEmptyTable": "No models available.",
          "sInfo": "Showing _TOTAL_ model(s) (_START_ to _END_)"
        }
      });
      
      jT.$(self.table).dataTable().fnAdjustColumnSizing();
    },
    
    listModels: function (uri) {
      var self = this;
      if (uri == null)
        uri = self.settings.baseUrl + '/model';
      else if (!self.settings.baseUrl)
        self.settings.baseUrl = jT.grabBaseUrl(uri);

      self.modelUri = uri;
      jT.$(self.table).dataTable().fnClearTable();
      jT.call(self, uri, function (result) {
        if (!!result) {
          self.models = result.model;
          jT.$(self.table).dataTable().fnAddData(result.model);
          ccLib.fireCallback(self.settings.onLoaded, self, result);
        }
      });
    },
    
    /* List algorithms that contain given 'needle' in their name
    */
    listAlgorithms: function (needle) {
      var self = this;
      var uri = self.settings.baseUrl + '/algorithm';
      if (!!needle)
        uri = ccLib.addParameter(uri, 'search=' + needle);
      jT.call(self, uri, function (result) {
        if (!!result) {
          self.algorithms = result.algorithm;
          jT.$(self.table).dataTable().fnAddData(result.algorithm);
          ccLib.fireCallback(self.settings.onLoaded, self, result);
        }
      });
    },
    
    getModel: function (algoUri, callback) {
      // TODO: make a request for getting / creating a model for given algorithm
    },
    
    runPrediction: function (compoundUri, modelUri, callback) {
      // TODO: make a POST request for prediction for given compound on given model
      // the callback is returned after the task polling is done.
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
