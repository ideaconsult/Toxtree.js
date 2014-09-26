/* toxdataset.js - A kit for querying/manipulating all available datasets
 *
 * Copyright 2012-2014, IDEAconsult Ltd. http://www.ideaconsult.net/
 * Created by Ivan Georgiev
**/

var jToxDataset = (function () {
  var defaultSettings = { // all settings, specific for the kit, with their defaults. These got merged with general (jToxKit) ones.
    shortStars: false,        // whether to show a star and number (short star) or maxStars with actual number highlighted.
    maxStars: 10,             // the maximal number of stars when in longStars mode
    selectionHandler: null,   // selection handler to be attached on checkbox, for jToxQuery integration
    noInterface: false,       // run in interface-less mode, with data retrieval and callback calling only
    sDom: "<Fif>rt",          // passed with dataTable settings upon creation
    oLanguage: null,          // passed with dataTable settings upon creation
    onLoaded: null,           // callback called when the is available
    loadOnInit: false,        // whether to make an (empty) call when initialized.
    oLanguage: {
      "sLoadingRecords": "No datasets found.",
      "sZeroRecords": "No datasets found.",
      "sEmptyTable": "No datasets available.",
      "sInfo": "Showing _TOTAL_ dataset(s) (_START_ to _END_)"
    },
    /* datasetUri */
    configuration: { 
      columns : {
        dataset: {
          'Id': { iOrder: 0, sTitle: "Id", mData: "URI", sWidth: "50px"},
          'Title': { iOrder: 1, sTitle: "Title", mData: "title", sDefaultContent: "-" },
          'Stars': { iOrder: 2, sTitle: "Stars", mData: "stars", sWidth: "160px" },
          'Info': { iOrder: 3, sTitle: "Info", mData: "rights", mRender: function (data, type, full) {
            return '<a target="_blank" href="' + data.URI + '">rights</a>';
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
        
    if (!self.settings.noInterface) {
      self.rootElement.appendChild(jT.getTemplate('#jtox-dataset'));
      self.init(settings);
    }
        
    // finally, wait a bit for everyone to get initialized and make a call, if asked to
    if (self.settings.datasetUri != undefined || self.settings.loadOnInit)
      self.listDatasets(self.settings.datasetUri)
  };
  
  cls.prototype = {
    init: function (settings) {
      var self = this;
      
      // arrange certain things on the columns first - like dealing with short/long stars
      self.settings.configuration.columns.dataset.Stars.mRender = function (data, type, full) {
        return type != 'display' ? data : jT.ui.putStars(self, data, "Dataset quality stars rating (worst) 1-10 (best)");
      };
      
      self.settings.configuration.columns.dataset.Id.mRender = function (data, type, full) {
        var num = parseInt(data.match(/https{0,1}:\/\/.*\/dataset\/(\d+).*/)[1]);
        if (type != 'display')
          return num;
        return '<a target="_blank" href="' + self.settings.baseUrl + '/ui/_dataset?dataset_uri=' + encodeURIComponent(data) + '"><span class="ui-icon ui-icon-link jtox-inline"></span> D' + num + '</a>';
      };
      
      if (self.settings.shortStars)
        self.settings.configuration.columns.dataset.Stars.sWidth = "40px";
      
      // deal if the selection is chosen
      if (!!self.settings.selectionHandler || !!self.settings.onDetails) {
        jT.ui.putActions(self, self.settings.configuration.columns.dataset.Id);
        self.settings.configuration.columns.dataset.Id.sWidth = "60px";
      }
      
      // again , so that changed defaults can be taken into account.
      self.settings.configuration = jT.$.extend(true, self.settings.configuration, settings.configuration);
      
      // READYY! Go and prepare THE table.
      self.table = jT.ui.putTable(self, jT.$('table', self.rootElement)[0], 'dataset');
    },
    
    listDatasets: function (uri) {
      var self = this;
      if (uri == null)
        uri = self.settings.baseUrl + '/dataset';
      else if (!self.settings.baseUrl)
        self.settings.baseUrl = jT.grabBaseUrl(uri);
      
      if (!self.settings.noInterface)
        jT.$(self.table).dataTable().fnClearTable();
      jT.call(self, uri, function (result, jhr) {
        if (!result && jhr.status == 404)
          result = { dataset: [] }; // empty one...
        if (!!result) {
          self.dataset = result.dataset;
          if (!self.settings.noInterface)
            jT.$(self.table).dataTable().fnAddData(result.dataset);
        }
        else
          self.dataset = null;
        ccLib.fireCallback(self.settings.onLoaded, self, result);
      });
    },
    
    query: function (uri) {
      this.listDatasets(uri);
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
