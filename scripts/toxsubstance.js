/* toxsubstance.js - A kit for browsing substances
 *
 * Copyright 2012-2014, IDEAconsult Ltd. http://www.ideaconsult.net/
 * Created by Ivan Georgiev
**/

var jToxSubstance = (function () {
  var defaultSettings = { // all settings, specific for the kit, with their defaults. These got merged with general (jToxKit) ones.
    selectable: true,
    selectionHandler: null,
    hasDetails: true,
    showControls: true,
    onLoaded: null,
    
    pageStart: 0,
    pageSize: 10,
    maxLength: 0,     // the initial value - most probably will be 
    /* substanceUri */
    configuration: { 
      columns : {
        substance: {
          'Id': { sTitle: 'Id', mData: 'URI', sDefaultContent: "-", sWidth: "60px", mRender: function (data, type, full) { 
            return (type != 'display') ? full.index : '&nbsp;-&nbsp;' + full.index + '&nbsp;-&nbsp;';
          } },
          'Substance Name': { sTitle: "Substance Name", mData: "name", sDefaultContent: "-" },
          'Substance UUID': { sTitle: "Substance UUID", mData: "i5uuid", mRender: function (data, type, full) {
            return (type != 'display') ? data : jT.ui.shortenedData(data, "Press to copy the UUID in the clipboard");
          } },
          'Composition Type': { sTitle: "Composition Type", mData: "substanceType", sWidth: "15%", sDefaultContent: '-' },
          'Public name': { sTitle: "Public name", mData: "publicname", sDefaultContent: '-'},
          'Reference substance UUID': { sTitle: "Reference substance UUID", mData: "referenceSubstance", mRender: function (data, type, full) {
            return (type != 'display') ? 
              data.i5uuid : 
              '<a target="_blank" href="' + data.uri + '">' + jT.ui.shortenedData(data.i5uuid, "Press to copy the UUID in the clipboard") + '</a>';
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
      
      var colId = self.settings.configuration.columns.substance.Id;
      jT.ui.putActions(self, colId, { 
        selection: self.settings.selectable,
        details: self.settings.hasDetails
      });
      colId.sName = '';
        
      var fnShowDetails = !self.settings.hasDetails ? null : function (row, e) {
        jT.$(e.currentTarget).toggleClass('ui-icon-circle-triangle-e');
        jT.$(e.currentTarget).toggleClass('ui-icon-circle-triangle-w');
        alert('Show/hide details'); 
      };
      
      jT.ui.putControls(self, { 
        nextPage: function () { self.nextPage(); },
        prevPage: function () { self.prevPage(); },
        sizeChange: function() { self.queryEntries(self.settings.pageStart, parseInt(jT.$(this).val())); },
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
          if (self.settings.hasDetails)
            jT.$('.jtox-details-open', nRow).on('click', function(e) {  fnShowDetails(nRow, e); });
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
        size = self.settings.pageSize;
        
      var qStart = Math.floor(from / size);
      var qUri = ccLib.addParameter(self.substanceUri, "page=" + qStart + "&pagesize=" + size);
      jT.call(self, qUri, function (result) {
        if (!!result) {
          jT.$(self.table).dataTable().fnClearTable();
        
          self.settings.pageSize = size;
          self.settings.pageStart = from;
        
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
      self.queryEntries(self.settings.pageStart);
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
