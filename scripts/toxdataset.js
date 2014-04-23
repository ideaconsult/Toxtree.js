/* toxdataset.js - A kit for querying/manipulating all available datasets
 *
 * Copyright 2012-2014, IDEAconsult Ltd. http://www.ideaconsult.net/
 * Created by Ivan Georgiev
**/

var jToxDataset = (function () {
  var defaultSettings = { // all settings, specific for the kit, with their defaults. These got merged with general (jToxKit) ones.
    shortStars: false,
    selectable: false,
    sDom: "<Fi>rt",
    /* listUri */
    configuration: { 
      columns : {
        dataset: {
          'Id': { iOrder: 0, sTitle: "Id", mData: "URI", sWidth: "50px", mRender: function (data, type, full) {
            var num = parseInt(data.match(/http:\/\/.*\/dataset\/([0-9]+).*/)[1]);
            if (type != 'display')
              return num;
            return '<a target="_blank" href="' + data + '"><span class="ui-icon ui-icon-link jtox-inline"></span> D' + num + '</a>';
          }},
          'Title': { iOrder: 1, sTitle: "Title", mData: "title", sDefaultContent: "-" },
          'Stars': { iOrder: 2, sTitle: "Stars", mData: "stars", sWidth: "160px", mRender: function (data, type, full) {
            if (type != 'display')
              return data;
            var res = '<div title="Dataset quality stars rating (worst) 1-10 (best)">';
            for (var i = 0;i < 10;++i) {
              res += '<span class="ui-icon ui-icon-star jtox-inline';
              if (i > data)
                res += ' transparent';
              res += '"></span>';
            }
            return res + '</div>';
          } },
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
    self.init();
        
    // finally, wait a bit for everyone to get initialized and make a call, if asked to
    self.listDatasets(self.settings.listUri)
  };
  
  cls.prototype = {
    init: function () {
      var self = this;
      
      // but before given it up - make a small sorting..
      if (self.settings.shortStars) {
        self.settings.configuration.columns.dataset.Stars.mRender = function (data, type, full) {
          if (type != 'display')
            return data;
          return '<span class="ui-icon ui-icon-star jtox-inline" title="Dataset quality stars rating (worst) 1-10 (best)"></span>' + data;
        };
        self.settings.configuration.columns.dataset.Stars.sWidth = "40px";
      }
      
      if (self.settings.selectable) {
        var oldFn = self.settings.configuration.columns.dataset.Id.mRender;
        self.settings.configuration.columns.dataset.Id.mRender = function (data, type, full) {
          var oldRes = oldFn(data, type, full);
          if (type != 'display')
            return oldRes;
          
          return  '<input type="checkbox" value="' + full.URI + '"' +
                  (!!self.settings.selectionHandler ? ' class="jtox-handler" data-handler="' + self.settings.selectionHandler + '"' : '') +
                  '/>' + oldRes;
        }
        self.settings.configuration.columns.dataset.Id.sWidth = "60px";
      }
      
      // READYY! Go and prepare THE table.
      self.table = jT.$('table', self.rootElement).dataTable({
        "bPaginate": false,
        "bLengthChange": false,
				"bAutoWidth": false,
        "sDom" : self.settings.sDom,
        "aoColumns": jT.processColumns(self, 'dataset'),
				"oLanguage": {
          "sLoadingRecords": "No datasets found.",
          "sZeroRecords": "No datasets found.",
          "sEmptyTable": "No datasets available.",
          "sInfo": "Showing _TOTAL_ dataset(s) (_START_ to _END_)"
        }
      });
      
      jT.$(self.table).dataTable().fnAdjustColumnSizing();
    },
    
    listDatasets: function (uri) {
      var self = this;
      if (uri == null)
        uri = self.settings.baseUrl + '/dataset';
      
      jT.$(self.table).dataTable().fnClearTable();
      jT.call(self, uri, function (result) {
        if (!!result) {
          jT.$(self.table).dataTable().fnAddData(result.dataset);
        }
      });
    },
    
    query: function (uri) {
      this.listDatasets(uri);
    },
    
    modifyUri: function (uri) {
      jT.$('input[type="checkbox"]', this.rootElement).each(function () {
        if (this.checked)
          uri = ccLib.addParameter(uri, 'dataset_uris[]=' + encodeURIComponent(this.value));
      })
      
      return uri;
    }
  };
  
  return cls;
})();
