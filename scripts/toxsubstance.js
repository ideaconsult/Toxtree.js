/* toxsubstance.js - A kit for browsing substances
 *
 * Copyright 2012-2014, IDEAconsult Ltd. http://www.ideaconsult.net/
 * Created by Ivan Georgiev
**/

var jToxSubstance = (function () {
  var defaultSettings = { // all settings, specific for the kit, with their defaults. These got merged with general (jToxKit) ones.
    showControls: true,
    selectionHandler: null,
    onDetails: null,
    onLoaded: null,
  
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
          'Info': { sTitle: "Info", mData: "externalIdentifiers", mRender: function (data, type, full) {
            var arr = [];
            for (var i = 0, dl = data.length;i < dl; ++i)
              arr.push(data[i].type);
            return arr.join(', ');
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
    
    self.pageStart = self.settings.pageStart;
    self.pageSize = self.settings.pageSize;
    
    self.rootElement.appendChild(jT.getTemplate('#jtox-substance'));
    self.init();
        
    // finally, if provided - make the query
    if (!!self.settings.substanceUri)
      self.querySubstance(self.settings.substanceUri)
  };
  
  cls.prototype = {
    init: function () {
      var self = this;
      
      // deal if the selection is chosen
      
      var colId = self.settings.configuration.columns.substance['Id'];
      jT.ui.putActions(self, colId, { 
        selection: self.settings.selectionHandler,
        details: !!self.settings.onDetails
      });
      colId.sTitle = '';
      
      self.settings.configuration.columns.substance['Owner'].mRender = function (data, type, full) {
        return (type != 'display') ? data : '<a target="_blank" href="' + self.settings.baseUrl + '/substanceowner/' + full.ownerUUID + '/substance">' + data + '</a>';
      };
        
      jT.ui.bindControls(self, { 
        nextPage: function () { self.nextPage(); },
        prevPage: function () { self.prevPage(); },
        sizeChange: function() { self.queryEntries(self.pageStart, parseInt(jT.$(this).val())); },
        filter: function () { jT.$(self.table).dataTable().fnFilter(jT.$(this).val()); }
      });
      
      // READYY! Go and prepare THE table.
      self.table = jT.$('table', self.rootElement).dataTable({
        "bPaginate": false,
        "bProcessing": true,
        "bLengthChange": false,
        "bAutoWidth": false,
        "sDom": "rt",
        "aoColumns": jT.ui.processColumns(self, 'substance'),
        "fnCreatedRow": function( nRow, aData, iDataIndex ) {
          if (!!self.settings.onDetails) {
            jT.$('.jtox-details-toggle', nRow).on('click', function(e) {  
              var root = jT.ui.toggleDetails(e, nRow);
              if (!!root) {
                ccLib.fireCallback(self.settings.onDetails, self, root, jT.$(this).data('data'), e);
              }
            });
          }
        },
        "bServerSide": false,
				"oLanguage": {
          "sLoadingRecords": "No substances found.",
          "sZeroRecords": "No substances found.",
          "sEmptyTable": "No substances available.",
          "sInfo": "Showing _TOTAL_ substance(s) (_START_ to _END_)"
        }
      });
      
      jT.$(self.table).dataTable().fnAdjustColumnSizing();
    },
    
    queryEntries: function(from, size) {
      var self = this;
      if (from < 0)
        from = 0;
        
      if (!size || size < 0)
        size = self.pageSize;
        
      var qStart = Math.floor(from / size);
      var qUri = ccLib.addParameter(self.substanceUri, "page=" + qStart + "&pagesize=" + size);
      jT.call(self, qUri, function (result) {
        if (!!result) {
          jT.$(self.table).dataTable().fnClearTable();
        
          self.pageSize = size;
          self.pageStart = from;
        
          for (var i = 0, rl = result.substance.length; i < rl; ++i)
            result.substance[i].index = i + from + 1;
          jT.$(self.table).dataTable().fnAddData(result.substance);
          
          self.updateControls(qStart, result.substance.length);

          // time to call the supplied function, if any.
          ccLib.fireCallback(self.settings.onLoaded, self, result);
        }
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
