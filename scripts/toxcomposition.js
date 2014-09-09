/* toxcomposition.js - A kit for visualizing substance composition(s)
 *
 * Copyright 2012-2014, IDEAconsult Ltd. http://www.ideaconsult.net/
 * Created by Ivan Georgiev
**/

var jToxComposition = (function () {
  var defaultSettings = { // all settings, specific for the kit, with their defaults. These got merged with general (jToxKit) ones.
    selectionHandler: null,   // selection handler, if needed for selection checkbox, which will be inserted if this is non-null
    showBanner: true,         // whether to show a banner of composition info before each compounds-table
    showDiagrams: false,      // whether to show diagram for each compound in the composition
    noInterface: false,       // run in interface-less mode - just data retrieval and callback calling.
    sDom: "rt<Ffp>",          // compounds (ingredients) table sDom
    onLoaded: null,
    
    /* compositionUri */
    configuration: {
      columns : {
        composition: {
          'Type': { sTitle: "Type", sClass : "left", sWidth : "10%", mData : "relation", mRender : function(val, type, full) {
					  if (type != 'display')
					    return '' + val;
					  var func = ("HAS_ADDITIVE" == val) ? full.proportion.function_as_additive : "";
					  return '<span class="camelCase">' +  val.substr(4).toLowerCase() + '</span>' + ((func === undefined || func === null || func == '') ? "" : " (" + func + ")");
          } },
          'Name': { sTitle: "Name", sClass: "camelCase left", sWidth: "15%", mData: "component.compound.name", mRender: function(val, type, full) {
						return (type != 'display') ? '' + val : 
						  '<a href="' + full.component.compound.URI + '" target="_blank" title="Click to view the compound"><span class="ui-icon ui-icon-link" style="float: left; margin-right: .3em;"></span></a>' + val; } },
					'EC No.': { sTitle: "EC No.", sClass: "left", sWidth: "10%", mData: "component.compound.einecs" },
					'CAS No.': { sTitle: "CAS No.", sClass : "left", sWidth: "10%", mData : "component.compound.cas" },
					'Typical concentration': { sTitle: "Typical concentration", sClass: "center", sWidth: "15%", mData: "proportion.typical", mRender: function(val, type, full) { return type != 'display' ? '' + val.value : jToxComposition.formatConcentration(val.precision, val.value, val.unit); } },
					'Concentration ranges': { sTitle: "Concentration ranges", sClass : "center colspan-2", sWidth : "20%", mData : "proportion.real", mRender : function(val, type, full) { return type != 'display' ? '' + val.lowerValue : jToxComposition.formatConcentration(val.lowerPrecision, val.lowerValue, val.unit); } },
					'Upper range': { sTitle: 'Upper range', sClass: "center", sWidth: "20%", mData: "proportion.real", mRender: function(val, type, full) { return type != 'display' ? '' + val.upperValue : jToxComposition.formatConcentration(val.upperPrecision, val.upperValue, val.unit); } },
					'Also': { sTitle: "Also", sClass: "center", bSortable: false, mData: "component.compound.URI", sDefaultContent: "-" }
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
  	return jT.ui.valueWithUnits((!precision || "=" == precision ? "" : precision) + val + " ", unit || '% (w/w)');
  };

  var fnDatasetValue = function (fid, old, value, features){
		return ccLib.extendArray(old, value != null ? value.trim().toLowerCase().split("|") : [value]).filter(ccNonEmptyFilter);
  };
  
  cls.prototype = {
    prepareTable: function (json, tab) {
      var self = this;
      
      // deal if the selection is chosen
      var colId = self.settings.configuration.columns.composition.Name;
      if (!!self.settings.selectionHandler) {
        jT.ui.putActions(self, colId);
        colId.sWidth = "60px";
      }
        
      // we need that processing to remove the title of "Also contained in..." column...
      var cols = jT.ui.processColumns(self, 'composition');
      for (var i = 0, cl = cols.length; i < cl; ++i)
        if (cols[i].sTitle == 'Also') {
          cols[i].sTitle = '';
          // we need to do this here, because 'self' is not defined up there...
          cols[i].mRender = function(val, type, full) { return !val ? '' : '<a href="' + (self.settings.baseUrl || self.baseUrl) + '/substance?type=related&compound_uri=' + encodeURIComponent(val) + '" target="_blank">Also contained in...</a>'; };
          break;
        }
        
      // if we have showDiagram set to true we need to show it up
      if (self.settings.showDiagrams) {
        var diagFeature = jToxCompound.baseFeatures['http://www.opentox.org/api/1.1#Diagram'];
        cols.push(jT.$.extend({}, diagFeature.column, { 
          sTitle: 'Structure', 
          mData: "component", 
          mRender: function (val, type, full) {
            diagFeature.process(val);
            return diagFeature.render(val.compound.diagramUri, type, val);
          } 
        }));
      }
      // READYY! Go and prepare THE table.
      self.table = jT.ui.putTable(self, jT.$('table.composition-table', tab)[0], 'composition', {
        "aoColumns": cols
      });
      
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
      self.baseUrl = jT.grabBaseUrl(uri);
      jT.call(self, uri, function (json) {
        if (!!json && !!json.composition) {
          // clear the old tabs, if any.
          var substances = {};
    
          jToxCompound.processFeatures(json.feature);
          // proprocess the data...
          for (var i = 0, cmpl = json.composition.length; i < cmpl; ++i) {
            var cmp = json.composition[i];
            
            // TODO: Start using show banner!
            jToxCompound.processEntry(cmp.component, json.feature, fnDatasetValue);
    
            // now prepare the subs        
            var theSubs = substances[cmp.compositionUUID];
            if (theSubs === undefined)
              substances[cmp.compositionUUID] = theSubs = { name: "", purity: "", maxvalue: 0, uuid: cmp.compositionUUID, composition: [] };
            
            theSubs.composition.push(cmp);
            if (cmp.compositionName != '' && cmp.compositionName != null)
              theSubs.name = cmp.compositionName;
              
            var val = cmp.proportion.typical;
            if (cmp.relation == 'HAS_CONSTITUENT' && theSubs.name == '') {
              theSubs.name = cmp.component.compound['name'] + ' (' + jToxComposition.formatConcentration(val.precision, val.value, val.unit) + ')';
            }
            
            if (cmp.relation == 'HAS_CONSTITUENT' && theSubs.maxvalue < val.value) {
              theSubs.maxvalue = val.value;
              val = cmp.proportion.real;
              theSubs.purity = jToxComposition.formatConcentration(null, val.lowerValue + '-' + val.upperValue, val.unit);
            }
          }
          
          // now make the actual filling
          if (!self.settings.noInterface) {
            for (var i in substances) {
              var panel = jT.getTemplate('#jtox-composition');
              self.rootElement.appendChild(panel);
              
              if (self.settings.showBanner)
                ccLib.fillTree(jT.$('.composition-info', panel)[0], substances[i]);
              else // we need to remove it
                jT.$('.composition-info', panel).remove();
              // we need to prepare tables, abyways.
              self.prepareTable(substances[i].composition, panel);
            }
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
