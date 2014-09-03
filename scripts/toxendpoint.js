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
    hideEmpty: false,         // hide tabs with empty endpoints, given the query passed
    sDom: "rt",          // passed with dataTable settings upon creation
    oLanguage: null,          // passed with dataTable settings upon creation
    onLoaded: null,           // callback called when the is available
    loadOnInit: false,        // whether to make an (empty) call when initialized. 
    /* summaryUri */
    configuration: { 
      columns : {
        endpoint: {
          'Id': { sTitle: "Id", mData: "endpoint", bSortable: false, sWidth: "30px", mRender: function (data, type, full) { return ''; } },
          'Name': { sTitle: "Name", mData: "value", sDefaultContent: "-", mRender: function (data, type, full) {
            return data + '<span class="float-right jtox-details">(<a title="Click to view substances" target="_blank" href="' + full.uri + '">' + full.substancescount + '</a>) [<span title="Number of values">' + full.count + '</span>]</span>';
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
    if (self.settings.datasetUri != undefined || self.settings.loadOnInit)
      self.loadEndpoints(self.settings.datasetUri)
  };
  
  cls.prototype = {
    init: function (settings) {
      var self = this;
      
      // deal if the selection is chosen
      if (!!self.settings.selectionHandler || !!self.settings.onDetails)
        jT.ui.putActions(self, self.settings.configuration.columns.endpoint.Id, { selection: self.settings.selectionHandler, details: !!self.settings.onDetails });
      
      self.settings.configuration.columns.endpoint.Id.sTitle = '';
      
      // again , so that changed defaults can be taken into account.
      self.settings.configuration = jT.$.extend(true, self.settings.configuration, settings.configuration);
      var cols = jT.ui.processColumns(self, 'endpoint');
      var language = jT.$.extend({
        "sLoadingRecords": "No endpoints found.",
        "sZeroRecords": "No endpoints found.",
        "sEmptyTable": "No endpoints available.",
        "sInfo": "Showing _TOTAL_ endpoint(s) (_START_ to _END_)"
      }, self.settings.oLanguage);
      
      // make the accordition now...
    	$(self.rootElement.firstElementChild).accordion( {
    		heightStyle: self.settings.heightStyle
    	});

      self.tables = { };
      // and now - initialize all the tables...
      jT.$('table', self.rootElement).each(function () {
        var name = this.className;
        self.tables[name] = jT.$(this).dataTable({
          "bPaginate": false,
          "bLengthChange": false,
  				"bAutoWidth": false,
          "sDom" : self.settings.sDom,
          "aoColumns": cols,
  				"oLanguage": language
        });
      
        jT.$(self.tables[name]).dataTable().fnAdjustColumnSizing();
      });
    },
    
    fillEntries: function (facet) {
      var self = this;
      // first we need to group them and extract some summaries
      var ends = { };
      for (var i = 0, fl = facet.length; i < fl; ++i) {
        var entry = facet[i];
        var cat = ends[entry.subcategory];
        if (cat == null)
          ends[entry.subcategory] = cat = { list: [], count: 0, substancescount: 0};

        cat.list.push(entry);
        cat.count += entry.count;
        cat.substancescount += entry.substancescount;
      }
      
      // now, as we're ready - go and fill everything
      jT.$('h3', self.rootElement).each(function () {
        var name = jT.$(this).data('cat');
        var cat = ends[name];
        
        jT.$('span.jtox-details', this).html("(" + cat.substancescount + ") [" + cat.count + "]"); 
        // TODO: fill the header with summary data
        var table = self.tables[name.replace(' ', '_')];
        table.fnClearTable();
        table.fnAddData(cat.list);
      });
    },
    
    loadEndpoints: function (uri) {
      var self = this;
      if (uri == null)
        uri = self.settings.baseUrl + '/query/study';
      else if (!self.settings.baseUrl)
        self.settings.baseUrl = jT.grabBaseUrl(uri);

      // make the call...
      jT.call(self, uri, function (result) {
        if (!!result) {
          self.summary = result.facet;
          if (!self.settings.noInterface)
            self.fillEntries(result.facet);
        }
        else
          self.facet = null;
        ccLib.fireCallback(self.settings.onLoaded, self, result);
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
