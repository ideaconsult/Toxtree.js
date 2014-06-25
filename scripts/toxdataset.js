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
    /* datasetUri */
    configuration: { 
      columns : {
        dataset: {
          'Id': { iOrder: 0, sTitle: "Id", mData: "URI", sWidth: "50px", mRender: function (data, type, full) {
            var num = parseInt(data.match(/http:\/\/.*\/dataset\/(\d+).*/)[1]);
            if (type != 'display')
              return num;
            return '<a target="_blank" href="' + data + '"><span class="ui-icon ui-icon-link jtox-inline"></span> D' + num + '</a>';
          }},
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
    
    self.rootElement.appendChild(jT.getTemplate('#jtox-dataset'));
    if (!self.settings.noInterface)
      self.init();
        
    // finally, wait a bit for everyone to get initialized and make a call, if asked to
    if (self.settings.datasetUri != undefined || self.settings.loadOnInit)
      self.listDatasets(self.settings.datasetUri)
  };
  
  cls.prototype = {
    init: function () {
      var self = this;
      
      // arrange certain things on the columns first - like dealing with short/long stars
      self.settings.configuration.columns.dataset.Stars.mRender = function (data, type, full) {
        return type != 'display' ? data : jT.ui.putStars(self, data, "Dataset quality stars rating (worst) 1-10 (best)");
      };
      if (self.settings.shortStars)
        self.settings.configuration.columns.dataset.Stars.sWidth = "40px";
      
      // deal if the selection is chosen
      if (!!self.settings.selectionHandler || !!self.settings.onDetails) {
        jT.ui.putActions(self, self.settings.configuration.columns.dataset.Id, { selection: self.settings.selectionHandler, details: !!self.settings.onDetails });
        self.settings.configuration.columns.dataset.Id.sWidth = "60px";
      }
      
      // READYY! Go and prepare THE table.
      self.table = jT.$('table', self.rootElement).dataTable({
        "bPaginate": false,
        "bLengthChange": false,
				"bAutoWidth": false,
        "sDom" : self.settings.sDom,
        "aoColumns": jT.ui.processColumns(self, 'dataset'),
				"oLanguage": jT.$.extend({
          "sLoadingRecords": "No datasets found.",
          "sZeroRecords": "No datasets found.",
          "sEmptyTable": "No datasets available.",
          "sInfo": "Showing _TOTAL_ dataset(s) (_START_ to _END_)"
        }, self.settings.oLanguage)
      });
      
      jT.$(self.table).dataTable().fnAdjustColumnSizing();
    },
    
    listDatasets: function (uri) {
      var self = this;
      if (uri == null)
        uri = self.settings.baseUrl + '/dataset';
      else if (!self.settings.baseUrl)
        self.settings.baseUrl = jT.grabBaseUrl(uri);
      
      if (!self.settings.noInterface)
        jT.$(self.table).dataTable().fnClearTable();
      jT.call(self, uri, function (result) {
        self.dataset = result.dataset;
        if (!!result) {
          if (!self.settings.noInterface)
            jT.$(self.table).dataTable().fnAddData(result.dataset);
          ccLib.fireCallback(self.settings.onLoaded, self, result);
        }
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
