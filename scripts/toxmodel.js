/* toxmodel.js - A kit for querying/manipulating all available models (algorithms)
 *
 * Copyright 2012-2014, IDEAconsult Ltd. http://www.ideaconsult.net/
 * Created by Ivan Georgiev
**/

var jToxModel = (function () {
  var defaultSettings = { // all settings, specific for the kit, with their defaults. These got merged with general (jToxKit) ones.
    selectable: false,
    selectionHandler: null,
    maxStars: 10,
    algorithmFilter: true,
    sDom: "<Fif>rt",
    /* modelUri */
    configuration: { 
      columns : {
        model: {
          'Id': { iOrder: 0, sTitle: "Id", mData: "id", sWidth: "50px", mRender: function (data, type, full) {
            if (type != 'display')
              return data;
            return '<a target="_blank" href="' + full.URI + '"><span class="ui-icon ui-icon-link jtox-inline"></span> M' + data + '</a>';
          }},
          'Title': { iOrder: 1, sTitle: "Title", mData: "title", sDefaultContent: "-" },
          'Stars': { iOrder: 2, sTitle: "Stars", mData: "stars", sWidth: "160px" },
          'Algorithm': {iOrder: 3, sTitle: "Algorithm", mData: "algorithm" },
          'Info': { iOrder: 4, sTitle: "Info", mData: "trainingDataset", mRender: function (data, type, full) {
            if (type != 'display' || !data)
              return data;
            return '<a href="' + data + '"><span class="ui-icon ui-icon-calculator"></span>&nbsp;training set</a>';
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
    self.listModels(self.settings.modelUri)
  };
  
  cls.prototype = {
    init: function () {
      var self = this;
      
      // but before given it up - make a small sorting..
      self.settings.configuration.columns.model.Stars.mRender = function (data, type, full) { return type != 'display' ? data : jToxDataset.putStars(self, data, "Model star rating (worst) 1 - 10 (best)"); };
      if (self.settings.shortStars) {
        self.settings.configuration.columns.model.Stars.sWidth = "40px";
      }
      
      // deal if the selection is chosen
      if (self.settings.selectable) {
        self.settings.configuration.columns.model.Id.mRender = jToxDataset.addSelection(self, self.settings.configuration.columns.model.Id.mRender);
        self.settings.configuration.columns.model.Id.sWidth = "60px";
      }
      
      // add this function here.
      self.settings.configuration.columns.model.Algorithm.mRender = function (data, type, full) { 
        var name = data.URI.match(/http:\/\/.*\/algorithm\/(\w+).*/)[1];
        if (type != 'display')
          return name;
        var res = '<a target="_blank" href="' + data.URI + '">' + 
                  '<img src="' + (self.settings.baseUrl || jT.settings.baseUrl) + data.img + '"/>&nbsp;' +
                  name + 
                  '</a>';
        if (self.settings.algorithmFilter) {
          res += '<a href="' + ccLib.addParameter(self.modelUri, 'algorithm=' + encodeURIComponent(data.URI)) + '"><span class="ui-icon ui-icon-calculator float-right" title="Show models using algorithm ' + name + '"></span></a>';
        }

        return res;
      };
      
      
      // READYY! Go and prepare THE table.
      self.table = jT.$('table', self.rootElement).dataTable({
        "bPaginate": false,
        "bLengthChange": false,
				"bAutoWidth": false,
        "sDom" : self.settings.sDom,
        "aoColumns": jT.processColumns(self, 'model'),
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

      self.modelUri = uri;
      jT.$(self.table).dataTable().fnClearTable();
      jT.call(self, uri, function (result) {
        if (!!result) {
          self.models = result.model;
          jT.$(self.table).dataTable().fnAddData(result.model);
        }
      });
    },
    
    runPrediction: function (modelUri, compoundUri, callback) {
      // TODO: implement this here.
    },
    
    query: function (uri) {
      this.listModels(uri);
    },
    
    modifyUri: function (uri) {
      jT.$('input[type="checkbox"]', this.rootElement).each(function () {
        if (this.checked)
          uri = ccLib.addParameter(uri, 'feature_uris[]=' + encodeURIComponent(this.value));
      })
      
      return uri;
    }
  };
  
  return cls;
})();
