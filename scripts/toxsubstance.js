/* toxsubstance.js - A kit for browsing substances
 *
 * Copyright 2012-2014, IDEAconsult Ltd. http://www.ideaconsult.net/
 * Created by Ivan Georgiev
**/

var jToxSubstance = (function () {
  var defaultSettings = { // all settings, specific for the kit, with their defaults. These got merged with general (jToxKit) ones.
    selectable: false,
    sDom: "<if>rt<Fp>",
    onLoaded: null,
    
    pageStart: 0,
    pageSize: 20,
    /* substanceUri */
    configuration: { 
      columns : {
        substance: {
          'Id': { mData: "URI", sWidth: "50px", mRender: function (data, type, full) {
            var num = parseInt(data.match(/http:\/\/.*\/dataset\/(\d+).*/)[1]);
            if (type != 'display')
              return num;
            return '<a target="_blank" href="' + data + '"><span class="ui-icon ui-icon-link jtox-inline"></span> D' + num + '</a>';
          }},
          'Name': { sTitle: "Name", mData: "name", sDefaultContent: "-" },
          'UUID': { sTitle: "UUID", mData: "i5uuid", sWidth: "160px" },
          'Composition Type': { sTitle: "Composition Type", mData: "substanceType", sDefaultContent: '-' },
          'Public name': { sTitle: "Public name", mData: "publicname", sDefaultContent: '-'},
          'Reference substance UUID': { sTitle: "Reference substance UUID", mData: "referenceSubstance", mRender: function (data, type, full) {
            return (type != 'display') ? 
              data.i5uuid : 
              '<a target="_blank" href="' + data.uri + '">' + jT.ui.shortenedData(data.i5uuid, "Press to copy the UUID in the clipboard") + '</a>';
          } },
          'Owner': { sTitle: "Owner", mData: "ownerName", sDefaultContent: '-'},
          'Info': { sTitle: "Info", mData: "externalIdentifiers", mReder: function (data, type, full) {
            
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
      var colIdFn = function (data, type, full) {
        if (type != 'display')
          return data;

        var res = '';
        res += '&nbsp;-&nbsp;' + data + '&nbsp;-&nbsp;';
        if (self.settings.hasDetails)
          res += '<span class="jtox-details-open ui-icon ui-icon-circle-triangle-e" title="Press to open/close detailed info for this substance"></span>';
        return res;
      };
      
      if (self.settings.selectable) {
        coldId.mRender = jT.ui.addSelection(self, colIdFn);
        colId.sWidth = "60px";
      }
      else
        colId.mRender = colIdFn;
        
      var fnShowDetails = !self.settings.hasDetails ? null : function (row, e) {
        jT.$(e.currentTarget).toggleClass('ui-icon-circle-triangle-e');
        jT.$(e.currentTarget).toggleClass('ui-icon-circle-triangle-w');
        alert('Show/hide details'); 
      };
      
      // READYY! Go and prepare THE table.
      self.table = jT.$('table', self.rootElement).dataTable({
        "bPaginate": true,
        "bLengthChange": true,
				"bAutoWidth": true,
        "sDom" : self.settings.sDom,
        "aoColumns": jT.ui.processColumns(self, 'substance'),
        "fnCreatedRow": function( nRow, aData, iDataIndex ) {
          if (self.settings.hasDetails)
            jT.$('.jtox-details-open', nRow).on('click', function(e) {  fnShowDetails(nRow, e); });
        },
        "bServerSide": true,
        "fnServerData": function ( sSource, aoData, fnCallback, oSettings ) { self.queryEntries(info, fnCallback); },
				"oLanguage": {
          "sLoadingRecords": "No substances found.",
          "sZeroRecords": "No substances found.",
          "sEmptyTable": "No substances available.",
          "sInfo": "Showing _TOTAL_ substance(s) (_START_ to _END_)"
        }
      });
      
      jT.$(self.table).dataTable().fnAdjustColumnSizing();
    },
    
    queryEntries: function (info, callback) {
      var self = this;
      var uri = self.substanceUri
      jT.call(self, , function (result) {
        if (!!result) {
          
        }
      });
      
    },
    
    querySubstance: function (uri) {
      var self = this;
      self.substanceUri = jT.grabPaging(uri);
    },   
    
    query: function (uri) {
      this.querySubstance(uri);
    }
  };
  
  return cls;
})();
