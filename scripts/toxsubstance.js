/* toxsubstance.js - A kit for browsing substances
 *
 * Copyright 2012-2014, IDEAconsult Ltd. http://www.ideaconsult.net/
 * Created by Ivan Georgiev
**/

var jToxSubstance = (function () {
  var defaultSettings = { // all settings, specific for the kit, with their defaults. These got merged with general (jToxKit) ones.
    showControls: true,       // show navigation controls or not
    selectionHandler: null,   // if given - this will be the name of the handler, which will be invoked by jToxQuery when the attached selection box has changed...
    embedComposition: null,   // embed composition listing as details for each substance - it valid only if onDetails is not given.
    noInterface: false,       // run in interface-less mode - only data retrieval and callback calling.
    onDetails: null,          // called when a details row is about to be openned. If null - no details handler is attached at all.
    onLoaded: null,           // called when the set of substances (for this page) is loaded.
    oLanguage: {
      "sLoadingRecords": "No substances found.",
      "sZeroRecords": "No substances found.",
      "sEmptyTable": "No substances available.",
      "sInfo": "Showing _TOTAL_ substance(s) (_START_ to _END_)"
    },
  
    pageStart: 0,
    pageSize: 10,
    /* substanceUri */
    configuration: { 
      columns : {
        substance: {
          'Id': { sTitle: 'Id', mData: 'URI', sDefaultContent: "-", sWidth: "60px", mRender: function (data, type, full) { 
            return (type != 'display') ? full.index : '&nbsp;-&nbsp;' + full.index + '&nbsp;-&nbsp;';
          } },
          'Substance Name': { sTitle: "Substance Name", mData: "name", sDefaultContent: "-" },
          'Substance UUID': { sTitle: "Substance UUID", mData: "i5uuid", mRender: function (data, type, full) {
            return (type != 'display') ? data : jT.ui.shortenedData('<a target="_blank" href="' + full.URI + '/study">' + data + '</a>', "Press to copy the UUID in the clipboard", data)
          } },
          'Substance Type': { sTitle: "Substance Type", mData: "substanceType", sWidth: "15%", sDefaultContent: '-' },
          'Public name': { sTitle: "Public name", mData: "publicname", sDefaultContent: '-'},
          'Reference substance UUID': { sTitle: "Reference substance UUID", mData: "referenceSubstance", mRender: function (data, type, full) {
            return (type != 'display') ? data.i5uuid : jT.ui.shortenedData('<a target="_blank" href="' + data.uri + '">' + data.i5uuid + '</a>', "Press to copy the UUID in the clipboard", data.i5uuid);
          } },
          'Owner': { sTitle: "Owner", mData: "ownerName", sDefaultContent: '-'},
          'Info': { sTitle: "Info", mData: "externalIdentifiers", mRender: function (data, type, full) { return ccLib.joinDeep(data, 'type', ', '); }
          }
        }
      }
    }
  };
  
  var cls = function (root, settings) {
    var self = this;
    self.rootElement = root;
    jT.$(root).addClass('jtox-toolkit'); // to make sure it is there even when manually initialized
    
    self.settings = jT.$.extend(true, {}, defaultSettings, jT.settings, settings);

    self.pageStart = self.settings.pageStart;
    self.pageSize = self.settings.pageSize;
    
    if (!self.settings.noInterface) {
      if (self.settings.embedComposition && self.settings.onDetails == null) {
        self.settings.onDetails = function (root, data, element) {
          new jToxComposition(root, jT.$.extend(
            {}, 
            self.settings, 
            (typeof self.settings.embedComposition == 'object' ? self.settings.embedComposition : jT.blankSettings), 
            { compositionUri : data.URI + '/composition' }
          ));
        };
      }

      self.rootElement.appendChild(jT.getTemplate('#jtox-substance'));
      self.init(settings);
    }    
        
    // finally, if provided - make the query
    if (!!self.settings.substanceUri)
      self.querySubstance(self.settings.substanceUri)
  };
  
  cls.prototype = {
    init: function (settings) {
      var self = this;
      
      // deal if the selection is chosen
      var colId = self.settings.configuration.columns.substance['Id'];
      jT.ui.putActions(self, colId);
      colId.sTitle = '';
      
      self.settings.configuration.columns.substance['Owner'].mRender = function (data, type, full) {
        return (type != 'display') ? data : '<a target="_blank" href="' + self.settings.baseUrl + '/substanceowner/' + full.ownerUUID + '/substance">' + data + '</a>';
      };
      
      if (self.settings.showControls) {
        jT.ui.bindControls(self, { 
          nextPage: function () { self.nextPage(); },
          prevPage: function () { self.prevPage(); },
          sizeChange: function() { self.queryEntries(self.pageStart, parseInt(jT.$(this).val())); },
          filter: function () { jT.$(self.table).dataTable().fnFilter(jT.$(this).val()); }
        });
      }
      else
        jT.$('.jtox-controls', self.rootElement).remove();
      
      // again , so that changed defaults can be taken into account.
      self.settings.configuration = jT.$.extend(true, self.settings.configuration, settings.configuration);
      
      // READYY! Go and prepare THE table.
      self.table = jT.ui.putTable(self, jT.$('table', self.rootElement)[0], 'substance', { "sDom": "rt" });
    },
    
    queryEntries: function(from, size) {
      var self = this;
      if (from < 0)
        from = 0;
        
      if (!size || size < 0)
        size = self.pageSize;
        
      var qStart = Math.floor(from / size);
      var qUri = ccLib.addParameter(self.substanceUri, "page=" + qStart + "&pagesize=" + size);
      jT.call(self, qUri, function (result, jhr) {
        if (!result && jhr.status == 404)
          result = { substabce: [] }; // empty one
        if (!!result) {
          self.pageSize = size;
          self.pageStart = from;
        
          for (var i = 0, rl = result.substance.length; i < rl; ++i)
            result.substance[i].index = i + from + 1;

          self.substance = result.substance;
          if (!self.settings.noInterface) {
            jT.$(self.table).dataTable().fnClearTable();
            jT.$(self.table).dataTable().fnAddData(result.substance);
            
            self.updateControls(qStart, result.substance.length);
          }
        }
        // time to call the supplied function, if any.
        ccLib.fireCallback(self.settings.onLoaded, self, result);
      });
    },
    
    querySubstance: function (uri) {
      var self = this;
      self.substanceUri = jT.grabPaging(self, uri);
      if (ccLib.isNull(self.settings.baseUrl))
        self.settings.baseUrl = jT.grabBaseUrl(uri);
      self.queryEntries(self.pageStart);
    },   
    
    query: function (uri) {
      this.querySubstance(uri);
    }
  };
  
  // some "inheritance" :-)
  cls.prototype.nextPage = jToxCompound.prototype.nextPage;
  cls.prototype.prevPage = jToxCompound.prototype.prevPage;
  cls.prototype.updateControls = jToxCompound.prototype.updateControls;
  
  return cls;
})();
