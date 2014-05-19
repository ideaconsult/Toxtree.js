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
    maxLength: 0,     // the initial value - most probably will be 
    /* substanceUri */
    configuration: { 
      columns : {
        substance: {
          'Id': { sTitle: 'Action', mData: 'URI', sDefaultContent: "-"}, // a placeholder
          'Substance Name': { sTitle: "Substance Name", mData: "name", sDefaultContent: "-" },
          'Substance UUID': { sTitle: "Substance UUID", mData: "i5uuid", sClass: "shortened", sWidth: "60px" },
          'Composition Type': { sTitle: "Composition Type", mData: "substanceType", sDefaultContent: '-' },
          'Public name': { sTitle: "Public name", mData: "publicname", sDefaultContent: '-'},
          'Reference substance UUID': { sTitle: "Reference substance UUID", mData: "referenceSubstance", sWidth: "60px", mRender: function (data, type, full) {
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
      colId.bVisible = true;
      colId.sName = '';
      var idFn = function (data, type, full) {
        if (type != 'display')
          return data;

        var res = '';
        res += '&nbsp;-&nbsp;' + data + '&nbsp;-&nbsp;';
        if (self.settings.hasDetails)
          res += '<span class="jtox-details-open ui-icon ui-icon-circle-triangle-e" title="Press to open/close detailed info for this substance"></span>';
        return res;
      };
      
      if (self.settings.selectable) {
        colInfo.mRender = jT.ui.addSelection(self, infoFn);
        colInfo.sWidth = "60px";
      }
      else
        colInfo.mRender = infoFn;
        
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
    
    queryEntries: function (aoData, fnCallback) {
      var self = this;
      var info = jT.ui.queryInfo(aoData);
      var data = { "sEcho": info.sEcho, iTotalRecords: 0, iTotalDisplayRecords: 0, aaData: [] };
      if (!self.substanceUri) {
        fnCallback(data);
        return;
      }
      
      var qStart = Math.floor(info.iDisplayStart / info.iDisplayLength);
      var uri = ccLib.addParameter(self.substanceUri, "page=" + qStart + "&pagesize=" + info.iDisplayLength);
      jT.call(self, uri, function (result) {
        if (!!result) {
          for (var i = 0, rl = result.substance.length; i < rl; ++i)
            result.substance[i].index = i + info.
          data.iTotalRecords = result.substance.length;
          data.iTotalDisplayRecords = result.substance.length;
          data.aaData = result.substance;
          fnCallback(data);
        }
      });
    },
    
    querySubstance: function (uri) {
      var self = this;
      self.substanceUri = jT.grabPaging(self, uri);
      jT.$(self.table).dataTable().fnFilter('');
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
