/* toxcomposition.js - A kit for visualizing substance composition(s)
 *
 * Copyright 2012-2014, IDEAconsult Ltd. http://www.ideaconsult.net/
 * Created by Ivan Georgiev
**/

var jToxComposition = (function () {
  var defaultSettings = { // all settings, specific for the kit, with their defaults. These got merged with general (jToxKit) ones.
    selectable: false,    // whether to show selection checkbox on each row
    showBanner: true,     // whether to show a banner of composition info before each compounds-table
    sDom: "rt<Ffp>",   // compounds (ingredients) table sDom
    onLoaded: null,
    
    /* compositionUri */
    configuration: {
      columns : {
        composition: {
          'Type': { sTitle: "Type", sClass : "left", sWidth : "10%", mData : "relation", mRender : function(val, type, full) {
					  if (type != 'display')
					    return '' + val;
					  var func = ("HAS_ADDITIVE" == val) ? full.proportion.function_as_additive : "";
					  return '<span class="camelCase">' +  val.replace("HAS_", "").toLowerCase() + '</span>' + ((func === undefined || func === null || func == '') ? "" : " (" + func + ")");
          } },
          'Name': { sTitle: "Name", sClass: "camelCase left", sWidth: "15%", mData: "component.compound.name", mRender: function(val, type, full) {
						return (type != 'display') ? '' + val : 
						  '<a href="' + full.component.compound.URI + '" target="_blank" title="Click to view the compound"><span class="ui-icon ui-icon-link" style="float: left; margin-right: .3em;"></span></a>' + val; } },
					'EC No.': { sTitle: "EC No.", sClass: "left", sWidth: "10%", mData: "component.compound.einecs" },
					'CAS No.': { sTitle: "CAS No.", sClass : "left", sWidth: "10%", mData : "component.compound.cas" },
					'Typical concentration': { sTitle: "Typical concentration", sClass: "center", sWidth: "15%", mData: "proportion.typical", mRender: function(val, type, full) { return type != 'display' ? '' + val.value : jToxComposition.formatConcentration(val.precision, val.value, val.unit); } },
					'Concentration ranges': { sTitle: "Concentration ranges", sClass : "center colspan-2", sWidth : "20%", mData : "proportion.real", mRender : function(val, type, full) { return type != 'display' ? '' + val.lowerValue : jToxComposition.formatConcentration(val.lowerPrecision, val.lowerValue, val.unit); } },
					'Upper range': { sTitle: 'Upper range', sClass: "center", sWidth: "20%", mData: "proportion.real", mRender: function(val, type, full) { return type != 'display' ? '' + val.upperValue : jToxComposition.formatConcentration(val.upperPrecision, val.upperValue, val.unit); } },
					'Also': { sTitle: "Also", sClass: "center", bSortable: false, mData: "component.compound.URI", mRender: function(val, type, full) { return !val ? '' : '<a href="' + (jT.settings.baseUrl || self.baseUrl) + 'substance?type=related&compound_uri=' + encodeURIComponent(val) + '" target="_blank">Also contained in...</span></a>'; } }
				}
      }
    }
  };
  
  var cls = function (root, settings) {
    var self = this;
    self.rootElement = root;
    jT.$(root).addClass('jtox-toolkit'); // to make sure it is there even when manually initialized
    
    self.settings = jT.$.extend(true, {}, defaultSettings, jT.settings, settings);
    
    // finally, if provided - make the query
    if (!!self.settings.compositionUri)
      self.queryComposition(self.settings.compositionUri)
  };
  
  cls.formatConcentration = function (precision, val, unit) {
  	return ((precision === undefined || precision === null || "=" == precision ? "" : precision) + val + " " + (unit == null || unit == '' ? '<span class="units">% (w/w)</span>' : unit)).replace(/ /g, "&nbsp;").replace("span&nbsp;", "span ");
  };

  var fnDatasetValue = function (fid, old, value, features){
		return ccLib.extendArray(old, value != null ? value.trim().toLowerCase().split("|") : [value]).filter(ccNonEmptyFilter);
  };
  
  cls.prototype = {
    prepareTable: function (json, tab) {
      var self = this;
      
      // deal if the selection is chosen
      var colId = self.settings.configuration.columns.composition.Name;
      if (self.settings.selectable) {
        colId.mRender = jT.ui.addSelection(self, colId.mRender);
        colId.sWidth = "60px";
      }
        
      // we need that processing to remove the title of "Also contained in..." column...
      var cols = jT.ui.processColumns(self, 'composition');
      for (var i = 0, cl = cols.length; i < cl; ++i)
        if (cols[i].sTitle == 'Also') {
          cols[i].sTitle = '';
          break;
        }
      // READYY! Go and prepare THE table.
      self.table = jT.$('table.composition-table', tab).dataTable({
        "bPaginate": false,
        "bLengthChange": false,
				"bAutoWidth": false,
        "bServerSide": false,
        "sDom" : self.settings.sDom,
        "aoColumns": cols,
      });
      
      jT.$(self.table).dataTable().fnAdjustColumnSizing();
      jT.$(self.table).dataTable().fnAddData(json);
      // now make a few fixing for multi-column title
      var colSpan = jT.$('th.colspan-2', self.table);
      jT.$(colSpan).attr('colspan', 2);
      jT.$(jT.$(colSpan).next()).remove();
      return self.table;
    },
    
    queryComposition: function (uri) {
      var self = this;
      self.compositionUri = uri;
      jT.call(self, uri, function (json) {
        if (!!json && !!json.composition) {
          // clear the old tabs, if any.
          var substances = {};
    
          jToxCompound.processFeatures(json.feature);
          // proprocess the data...
          for (var i = 0, cmpl = json.composition.length; i < cmpl; ++i) {
            var cmp = json.composition[i];
            
            jToxCompound.processEntry(cmp.component, json.feature, fnDatasetValue);
    
            // now prepare the subs        
            var theSubs = substances[cmp.compositionUUID];
            if (theSubs === undefined)
              substances[cmp.compositionUUID] = theSubs = { name: "", purity: "", maxvalue: 0, uuid: cmp.compositionUUID, composition: [] };
            
            theSubs.composition.push(cmp);
            var val = cmp.proportion.typical;
            if (cmp.relation == 'HAS_CONSTITUENT' && (theSubs.maxvalue < val.value || theSubs.name == '')) {
              theSubs.name = cmp.component.compound['name'] + ' ' + jToxComposition.formatConcentration(val.precision, val.value, val.unit);
              theSubs.maxvalue = val.value;
              val = cmp.proportion.real;
              theSubs.purity = (val.lowerValue + '-' + val.upperValue + ' ' + (val.unit == null || val.unit == '' ? '<span class="units">% (w/w)</span>' : val.unit)).replace(/ /g, "&nbsp;").replace("span&nbsp;", "span ");
            }
          }
          
          // now make the actual filling
          for (var i in substances) {
            var panel = jT.getTemplate('#jtox-composition');
            self.rootElement.appendChild(panel);
            ccLib.fillTree(jT.$('.composition-info', panel)[0], substances[i]);
            self.prepareTable(substances[i].composition, panel);
          }
          
          ccLib.fireCallback(self.settings.onLoaded, self, json.composition);
        }
      });
    },   
    
    query: function (uri) {
      jT.$(self.rootElement).empty();
      this.queryComposition(uri);
    }
  };
  
  return cls;
})();
