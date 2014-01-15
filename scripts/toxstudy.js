/* toxstudy.js - Study-related functions from jToxKit.
 *
 * Copyright 2012-2013, IDEAconsult Ltd. http://www.ideaconsult.net/
 * Created by Ivan Georgiev
**/

var jToxStudy = (function () {
  var defaultSettings = { 
    configuration: { 
      columns: { 
    		"main" : { },
    		"parameters": { },
    		"conditions": { },
    		"effects": { },
    		"protocol": { },
    		"interpretation": { }
    	}
    }
  };    // all settings, specific for the kit, with their defaults. These got merged with general (jToxKit) ones.
  var instanceCount = 0;
  
  var fnDatasetValue = function (old, value){
		return ccLib.extendArray(old, value != null ? value.trim().toLowerCase().split("|") : [value]).filter(ccNonEmptyFilter);
  };
  
  // constructor
  var cls = function (root, settings) {
    var self = this;
    self.rootElement = root;
    self.suffix = '_' + instanceCount++;
    
    self.settings = $.extend({}, defaultSettings, jToxKit.settings, settings); // i.e. defaults from jToxStudy
    // now we have our, local copy of settings.
    
    // get the main template, add it (so that jQuery traversal works) and THEN change the ids.
    // There should be no overlap, because already-added instances will have their IDs changed already...
    var tree = jToxKit.getTemplate('#jtox-studies');
    root.appendChild(tree);
    jToxKit.changeTabsIds(tree, self.suffix);
    
    // keep on initializing...
    var loadPanel = function(panel){
      if (panel){
        $('.jtox-study.unloaded', panel).each(function(i){
          var table = this;
          jToxKit.call(self, $(table).data('jtox-uri'), function(study){
            if (!!study) {
              $(table).removeClass('unloaded folded');  
              $(table).addClass('loaded');
              self.processStudies(panel, study.study, false);
            }
          });  
        });
      }
    };
    
    // initialize the tab structure for several versions of dataTables.
    $(tree).tabs({
      "select" : function(event, ui) {
        loadPanel(ui.panel);
      },
      "beforeActivate" : function(event, ui) {
        if (ui.newPanel)
          loadPanel(ui.newPanel[0]);
      }
    });
    
    // when all handlers are setup - make a call, if needed.    
    if (self.settings['substanceUri'] !== undefined){
      self.querySubstance(self.settings['substanceUri']);
    }
  };
  
  // now follow the prototypes of the instance functions.
  cls.prototype = {
    getFormatted: function (data, type, format) {
      var value = null;
      if (typeof format === 'function' )
        value = format.call(this, data, type);
      else if (typeof format === 'string' || typeof format === 'number')
        value = data[format];
      else
        value = data[0];
      
      return value;
    },
    
    renderMulti: function (data, type, full, format) {
      var self = this;
      var dlen = data.length;
      if (dlen < 2)
        return self.getFormatted(data[0], type, format);
  
      var height = 100 / dlen;
      var df = '<table>';
      for (var i = 0, dlen = data.length; i < dlen; ++i) {
        df += '<tr class="' + (i % 2 == 0 ? 'even' : 'odd') + '"><td class="center" style="height: ' + height + '%">' + self.getFormatted(data[i], type, format) + '</td></tr>';
      }
      
      df += '</table>';
      return df;
    },
    
    createCategory: function(tab, category) {
      var self = this;
  
      var theCat = $('.' + category + '.jtox-study', tab)[0];
      if (!theCat) {
        theCat = jToxKit.getTemplate('#jtox-study');
        tab.appendChild(theCat);
        $(theCat).addClass(category);
        
        // install the click handler for fold / unfold
        $('.jtox-study-title', theCat).click(function() {
          $(theCat).toggleClass('folded');
        });
      }
      
      return theCat;
    },
  
    updateCount: function(str, count) {
      if (count === undefined)
        count = 0;
      return str.replace(/(.+)\s\(([0-9]+)\)/, "$1 (" + count + ")");
    },
    
    // modifies the column title, according to configuration and returns "null" if it is marked as "invisible".
    ensureTable: function (tab, study) {
      var self = this;
      var defaultColumns = [
        { "sTitle": "Name", "sClass": "center middle", "sWidth": "20%", "mData": "protocol.endpoint" }, // The name (endpoint)
        { "sTitle": "Endpoint", "sClass": "center middle jtox-multi", "sWidth": "15%", "mData": "effects", "mRender": function (data, type, full) { return self.renderMulti(data, type, full, "endpoint");  } },   // Effects columns
        { "sTitle": "Result", "sClass": "center middle jtox-multi", "sWidth": "15%", "mData" : "effects", "mRender": function (data, type, full) { return self.renderMulti(data, type, full, function (data, type) { return formatLoHigh(data.result, type) }) } },
        { "sTitle": "Guideline", "sClass": "center middle", "sWidth": "15%", "mData": "protocol.guideline", "mRender" : "[,]", "sDefaultContent": "?"  },    // Protocol columns
        { "sTitle": "Owner", "sClass": "center middle shortened", "sWidth": "50px", "mData": "owner.company.name", "sDefaultContent": "?"  }, 
        { "sTitle": "UUID", "sClass": "center middle", "sWidth": "50px", "mData": "uuid", "bSearchable": false, "mRender" : function(data, type, full) { return type != "display" ? '' + data : jToxKit.shortenedData(data, "Press to copy the UUID in the clipboard"); } }
      ];
  
      var category = study.protocol.category.code;
      var theTable = $('.' + category + ' .jtox-study-table', tab)[0];
      if (!$(theTable).hasClass('dataTable')) {
  
        var colDefs = [];
        
        // start filling it
        var parCount = 0;
  
        var modifyColumn = function(col, group) {
          if (group == null)
            group = "main";
          var name = col.sTitle.toLowerCase();
          
          // helper function for retrieving col definition, if exists. Returns empty object, if no.          
          var getColDef = function (cat) {
            var catCol = self.settings.configuration.columns[cat];
            if (!ccLib.isNull(catCol)) {
              catCol = catCol[group];
              if (!ccLib.isNull(catCol))
                catCol = catCol[name];
            }

            if (ccLib.isNull(catCol))
              catCol = {};
            return catCol;
          };
          // now form the default column, if existing and the category-specific one...
          // extract column redefinitions and merge them all.
          col = $.extend(col, getColDef('_'), getColDef(category));
          return ccLib.isNull(col.bVisible) || col.bVisible ? col : null;
        };
  
        // this function takes care to add as columns all elements from given array
        var putAGroup = function(group, fProcess) {
          var count = 0;
          var skip = [];
          for (var p in group) {
            if (skip.indexOf(p) > -1)
              continue;
            if (group[p + " unit"] !== undefined)
              skip.push(p + " unit");
            var val = fProcess(p);
            if (ccLib.isNull(val))
              continue;
              
            colDefs.push(val);
            count++;
          }
          return count;
        }
        
        var putDefaults = function(start, len, group) {
          for (var i = 0;i < len; ++i) {
            var col = $.extend({}, defaultColumns[i + start]);
            col = modifyColumn(col, group);
            if (col != null)
              colDefs.push(col);
          }
        };
        
        // some value formatting functions
        var formatLoHigh = function (data, type) {
          var out = "";
          if (!ccLib.isNull(data)) {
            data.loValue = ccLib.trim(data.loValue);
            data.upValue = ccLib.trim(data.upValue);
            if (!ccLib.isEmpty(data.loValue) && !ccLib.isEmpty(data.upValue)) {
              out += (data.loQualifier == ">=") ? "[" : "(";
              out += data.loValue + ", " + data.upValue;
              out += (data.upQualifier == "<=") ? "]" : ") ";
            }
            else // either of them is non-undefined
            {
              var fnFormat = function (q, v) {
                return (!!q ? q : "=") + " " + v;
              };
              
              if (!ccLib.isEmpty(data.loValue))
                out += fnFormat(data.loQualifier, data.loValue);
              else if (!ccLib.isEmpty(data.upValue))
                out += fnFormat(data.upQualifier, data.upValue);
              else
                out += '-';
            }
            
            out += (data.unit = ccLib.trim(data.unit));
          }
          return out.replace(/ /g, "&nbsp;");
        };
        
        var formatUnits = function(data, unit) {
          data = ccLib.trim(data);
          unit = ccLib.trim(unit);
          return !ccLib.isNull(data) ? (data + (!!unit ? "&nbsp;" + unit : "")) : "-";
        };

        putDefaults(0, 1, "main");
        
        // use it to put parameters...
        putAGroup(study.parameters, function(p) {
          if (study.effects[0].conditions[p] !== undefined  || study.effects[0].conditions[p + " unit"] !== undefined)
            return undefined;

          var col = {
            "sTitle" : p,
            "sClass" : "center middle", 
            "mData" : "parameters." + p,
            "sDefaultContent": "-"
          };
          
          col = modifyColumn(col, "parameters");
          if (col == null)
            return null;
          
          if (study.parameters[p] !== undefined && study.parameters[p] != null){
            col["mRender"] = study.parameters[p].loValue === undefined ?
              function (data, type, full) { return formatUnits(data, full[p + " unit"]); } : 
              function (data, type, full) { return formatLoHigh(data.parameters[p], type); };
          }
          
          return col;
        });
        // .. and conditions
        putAGroup(study.effects[0].conditions, function(c){
          var col = { 
            "sTitle" : c,
            "sClass" : "center middle jtox-multi", 
            "mData" : "effects"
          };
          
          col = modifyColumn(col, "conditions");
          if (col == null)
            return null;
          
          var rnFn = null;
          if (study.effects[0].conditions[c] !== undefined && study.effects[0].conditions[c] != null)
            rnFn = study.effects[0].conditions[c].loValue === undefined ? 
              function(data, type) { return formatUnits(data.conditions[c],  data.conditions[c + " unit"]); } : 
              function(data, type) { return formatLoHigh(data.conditions[c], type); }
          else
            rnFn = function(data, type) { return "-"; }
            
          col["mRender"] = function(data, type, full) { return self.renderMulti(data, type, full, rnFn); };
          return col;
        });
        
        // add also the "default" effects columns
        putDefaults(1, 2, "effects");
  
        // now is time to put interpretation columns..
        putAGroup(study.interpretation, function(i){
          var col = { "sTitle": i, "sClass" : "center middle jtox-multi", "mData" : "interpretation." + i, "sDefaultContent": "-"};
          return modifyColumn(col, "interpretation");
        });
        
        // finally put the protocol entries
        putDefaults(3, 3, "protocol");
        
        // but before given it up - make a small sorting..
        colDefs.sort(function(a, b) {
          var valA = ccLib.isNull(a.iOrder) ? 0 : a.iOrder;
          var valB = ccLib.isNull(b.iOrder) ? 0 : b.iOrder;
          return valA - valB;
        });
        
        // READYY! Go and prepare THE table.
        $(theTable).dataTable( {
          "bPaginate": true,
          "bProcessing": true,
          "bLengthChange": false,
  				"bAutoWidth": false,
          "sDom" : "rt<Fip>",
          "aoColumns": colDefs,
          "fnInfoCallback": function( oSettings, iStart, iEnd, iMax, iTotal, sPre ) {
            var el = $('.jtox-study-title .data-field', $(this).parents('.jtox-study'))[0];
            el.innerHTML = self.updateCount(el.innerHTML, iTotal);
            return sPre;
          },
  				"oLanguage": {
            "sProcessing": "<img src='" + self.baseUrl + "images/24x24_ambit.gif' border='0'>",
            "sLoadingRecords": "No studies found.",
            "sZeroRecords": "No studies found.",
            "sEmptyTable": "No studies available.",
            "sInfo": "Showing _TOTAL_ study(s) (_START_ to _END_)",
            "sLengthMenu": 'Display <select>' +
              '<option value="10">10</option>' +
              '<option value="20">20</option>' +
              '<option value="50">50</option>' +
              '<option value="100">100</option>' +
              '<option value="-1">all</option>' +
              '</select> studies.'
          }
        });
      }
      else
        $(theTable).dataTable().fnClearTable();
        
      return theTable;
    },
    
    processSummary: function (summary) {
      var self = this;
      var typeSummary = [];
      
      // first - clear all existing tabs
      var catList = self.rootElement.getElementsByClassName('jtox-study');
      while(catList.length > 0) {
        catList[0].parentNode.removeChild(catList[0]);
      }
      
      // create the groups on the corresponding tabs
      for (var s in summary) {
        var sum = summary[s];
        var top = sum.topcategory.title;
        if (!top)
          continue;
        var top = top.replace(/ /g, "_");
        var tab = $('.jtox-study-tab.' + top, self.rootElement)[0];
        
        var catname = sum.category.title;
        if (!catname) {
          typeSummary[top] = sum.count;
        }
        else {
          var cat = self.createCategory(tab, catname);
          $(cat).data('jtox-uri', sum.category.uri);
        }
      }
      
      // update the number in the tabs...
      $('ul li a', self.rootElement).each(function (i){
        var data = $(this).data('type');
        if (!!data){
          var cnt = typeSummary[data];
          var el = $(this)[0];
          el.innerHTML = (self.updateCount(el.innerHTML, cnt));
        }
      });
      
      // now install the filter box handler. It delays the query a bit and then spaws is to all tables in the tab.
      var filterTimeout = null;
      var fFilter = function (ev) {
        if (!!filterTimeout)
          clearTimeout(filterTimeout);
    
        var field = ev.currentTarget;
        var tab = $(this).parents('.jtox-study-tab')[0];
        
        filterTimeout = setTimeout(function() {
          var tabList = tab.getElementsByClassName('jtox-study-table');
          for (var t = 0, tlen = tabList.length; t < tlen; ++t) {
            $(tabList[t]).dataTable().fnFilter(field.value);
          }
        }, 300);
      };
      
      var tabList = document.getElementsByClassName('jtox-study-tab');
      for (var t = 0, tlen = tabList.length;t < tlen; t++){
        var filterEl = tabList[t].getElementsByClassName('jtox-study-filter')[0].onkeydown = fFilter;
      }
    },
    
    processStudies: function (tab, study, map) {
      var self = this;
      var cats = [];
      
      // first swipe to map them to different categories...
      if (!map){
        // add this one, if we're not remapping. map == false assumes that all passed studies will be from
        // one category.    
        cats[study[0].protocol.category.code] = study;
      }
      else{
        for (var i = 0, slen = study.length; i < slen; ++i) {
          var ones = study[i];
          if (map) {
            if (cats[ones.protocol.category] === undefined) {
              cats[ones.protocol.category.code] = [ones];
            }
            else {
              cats[ones.protocol.category.code].push(ones);
            }
          }
        }
      }
  
      // now iterate within all categories (if many) and initialize the tables
      for (var c in cats) {
        var onec = cats[c];
        var aStudy = $('.' + c + '.jtox-study', tab)[0];
        if (aStudy === undefined)
          continue;
  
        ccLib.fillTree(aStudy, {title: onec[0].protocol.category.title + " (0)"});
        
        // now swipe through all studyies to build a "representative" one with all fields.
        var study = {};
        for (var i = 0, cl = onec.length; i < cl; ++i) {
          $.extend(true, study, onec[i]);
          if (!ccLib.isEmpty(study.parameters) && !ccLib.isEmpty(study.effects[0].conditions))
            break;
        }

        var theTable = self.ensureTable(tab, study);
        $(theTable).dataTable().fnAddData(onec);
        $(theTable).colResizable();
      }
      
      // we need to fix columns height's because of multi-cells
      $('#' + theTable.id + ' .jtox-multi').each(function(index){
        this.style.height = '' + this.offsetHeight + 'px';
      });
    },
    
    formatConcentration: function (precision, val, unit) {
    	return ((precision === undefined || precision === null || "=" == precision ? "" : precision) + val + " " + (unit == null || unit == '' ? "% (w/w)" : unit)).replace(/ /g, "&nbsp;");
    },
    
    processComposition: function(json){
      var self = this;
      var tab = $('.jtox-composition', self.rootElement)[0];
      
      // clear the old tabs, if any.
      if ($(tab).hasClass('unloaded')){
        $(tab).removeClass('unloaded');
        $(tab).empty();
      }
      
      var prepareFillTable = function (json, panel) {
        var theTable = $('.substances-table', panel);
        // prepare the table...
        $(theTable).dataTable({
  				"bSearchable": true,
  				"bProcessing" : true,
  				"bPaginate" : true,
          "sDom" : "rt<Fip>",
/*   				"sDom" : '<"help remove-bottom"i><"help"p>Trt<"help"lf>', */
/* 				  "sPaginationType": "full_numbers", */
  				"sPaginate" : ".dataTables_paginate _paging",
  				"bAutoWidth": false,
  				"oLanguage": {
            "sProcessing": "<img src='" + self.baseUrl + "images/24x24_ambit.gif' border='0'>",
            "sLoadingRecords": "No substances found.",
            "sZeroRecords": "No substances found.",
            "sEmptyTable": "No substances available.",
            "sInfo": "Showing _TOTAL_ substance(s) (_START_ to _END_)",
          },
  		    "aoColumns": [
            {  //1
    					"sClass" : "left",
    					"sWidth" : "10%",
    					"mData" : "relation",
    					"mRender" : function(val, type, full) {
    					  if (type != 'display')
    					    return '' + val;
    					  var func = ("HAS_ADDITIVE" == val) ? full.proportion.function_as_additive : "";
    					  return '<span class="camelCase">' +  val.replace("HAS_", "").toLowerCase() + '</span>' + ((func === undefined || func === null || func == '') ? "" : " (" + func + ")");
              }
            },	    
    				{ //2
    					"sClass" : "camelCase left",
    					"sWidth" : "15%",
    					"mData" : "component.compound.name",
    					"mRender" : function(val, type, full) {
    						return (type != 'display') ? '' + val : 
    						  '<a href="' + full.component.compound.URI + '" target="_blank" title="Click to view the compound"><span class="ui-icon ui-icon-link" style="float: left; margin-right: .3em;"></span></a>' + val;
    					}
    				},	    	
    				{ //3
    					"sClass" : "left",
    					"sWidth" : "10%",
    					"mData" : "component.compound.einecs",
    				},
    				{ //4
    					"sClass" : "left",
    					"sWidth" : "10%",
    					"mData" : "component.compound.cas",
    				},
    				{ //5
    					"sClass" : "center",
    					"sWidth" : "15%",
    					"mData" : "proportion.typical",
    					"mRender" : function(val, type, full) { return type != 'display' ? '' + val.value : self.formatConcentration(val.precision, val.value, val.unit); }
    				},
    				{ //6
    					"sClass" : "center",
    					"sWidth" : "15%",
    					"mData" : "proportion.real",
    					"mRender" : function(val, type, full) { return type != 'display' ? '' + val.lowerValue : self.formatConcentration(val.lowerPrecision, val.lowerValue, val.unit); }
    				},
    				{ //7
    					"sClass" : "center",
    					"sWidth" : "15%",
    					"mData" : "proportion.real",
    					"mRender" : function(val, type, full) { return type != 'display' ? '' + val.upperValue : self.formatConcentration(val.upperPrecision, val.upperValue, val.unit); }
    				}
  		    ]
  		  });

        // and fill up the table.
        $(theTable).dataTable().fnAddData(json);
        return theTable;
      };
      
      var substances = {};

      jToxDataset.processFeatures(json.feature);
      // proprocess the data...
      for (var i = 0, cmpl = json.composition.length; i < cmpl; ++i) {
        var cmp = json.composition[i];
        
        jToxDataset.processEntry(cmp.component, json.feature, fnDatasetValue);

        // now prepare the subs        
        var theSubs = substances[cmp.compositionUUID];
        if (theSubs === undefined)
          substances[cmp.compositionUUID] = theSubs = { name: "", purity: "", maxvalue: 0, uuid : cmp.compositionUUID, composition : [] };
        
        theSubs.composition.push(cmp);
        var val = cmp.proportion.typical;
        if (cmp.relation == 'HAS_CONSTITUENT' && (theSubs.maxvalue < val.value || theSubs.name == '')) {
          theSubs.name = cmp.component.compound['name'] + ' ' + self.formatConcentration(val.precision, val.value, val.unit);
          theSubs.maxvalue = val.value;
          val = cmp.proportion.real;
          theSubs.purity = (val.lowerValue + '-' + val.upperValue + ' ' + (val.unit == null || val.unit == '' ? "% (w/w)" : val.unit)).replace(/ /g, "&nbsp;");
        }
      }
      
      // now make the actual filling
      for (var i in substances) {
        var panel = jToxKit.getTemplate('#jtox-compoblock');
        tab.appendChild(panel);
        ccLib.fillTree($('.composition-info', panel)[0], substances[i]);
        prepareFillTable(substances[i].composition, panel);
      }
    },
    
    querySummary: function(substanceURI) {
      var self = this;
      
      jToxKit.call(self, substanceURI + "/studysummary", function(summary) {
        if (!!summary && !!summary.facet)
          self.processSummary(summary.facet);
      });
    },
    
    queryComposition: function(substanceURI) {
      var self = this;
      
      jToxKit.call(self, substanceURI + "/composition", function(composition) {
        if (!!composition && !!composition.composition)
          self.processComposition(composition);
        });
    },
    
    querySubstance: function(substanceURI) {
      var self = this;
      
      // re-initialize us on each of these calls.
      self.baseUrl = jToxKit.grabBaseUrl(substanceURI, 'substance');
      
      var rootTab = $('.jtox-substance', self.rootElement)[0];
      jToxKit.call(self, substanceURI, function(substance){
         if (!!substance && !!substance.substance && substance.substance.length > 0){
           substance = substance.substance[0];
           
           substance["showname"] = substance.publicname;
           if (ccLib.isEmpty(substance.showname))
            substance.showname = substance.name;
            
           ccLib.fillTree(self.rootElement, substance);
           // go and query for the reference query
           jToxKit.call(self, substance.referenceSubstance.uri, function (dataset){
             if (!!dataset) {
              jToxDataset.processDataset(dataset, null, fnDatasetValue);
              ccLib.fillTree(rootTab, dataset.dataEntry[0]);
             }
           });
           
           // query for the summary and the composition too.
           self.querySummary(substance.URI);
           self.queryComposition(substance.URI);
         }
      });
    }
  }; // end of prototype
  
  return cls;
})();
