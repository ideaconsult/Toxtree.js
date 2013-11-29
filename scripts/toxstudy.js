var jToxStudy = (function () {
  var defaultSettings = { };    // all settings, specific for the kit, with their default. These got merged with general (jToxKit) ones.
  var instanceCount = 0;
  var changeIds = function (root, suffix) {
    $('ul li a', root).each(function() {
      var id = $(this).attr('href').substr(1);
      var el = document.getElementById(id);
      id += suffix;
      el.id = id;
      $(this).attr('href', '#' + id);
    })  
  };
  
  // constructor
  var cls = function (root, settings) {
    var self = this;
    self.rootElement = root;
    self.settings = {};
    self.suffix = '_' + instanceCount++;
    
    ccLib.mergeSettings(defaultSettings, self.settings); // i.e. defaults from jToxStudy
    ccLib.mergeSettings(jToxKit.settings, self.settings);
    ccLib.mergeSettings(settings, self.settings);
    // now we have our, local copy of settings.

    // get the main template, add it (so that jQuery traversal works) and THEN change the ids.
    // There should be no overlap, because already-added instances will have their IDs changed already...
    var tree = jToxKit.getTemplate('#jtox-studies');
    root.appendChild(tree);
    changeIds(tree, self.suffix);
    
    // keep on initializing...
    var loadPanel = function(panel){
      if (panel){
        $('.jtox-study.unloaded', panel).each(function(i){
          var table = this;
          jToxKit.call(self, $(table).data('jtox-uri'), function(study){
            $(table).removeClass('unloaded folded');  
            $(table).addClass('loaded');
            self.processStudies(panel, study.study, true); // TODO: must be changed to 'false', when the real summary is supplied
            $('.dataTable', table).dataTable().fnAdjustColumnSizing();
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
    
    formatResult: function (data, type) {
      var out = "";
      data = data.result;
      if (data.loValue !== undefined && data.upValue !== undefined) {
        out += (data.loQualifier == ">=") ? "[" : "(";
        out += data.loValue + ", " + data.upValue;
        out += (data.upQualifier == "<=") ? "]" : ") ";
      }
      else // either of them is non-undefined
      {
        var fnFormat = function (q, v) {
          return ((q !== undefined) ? q : "=") + " " + v;
        };
        
        out += (data.loValue !== undefined) ? fnFormat(data.loQualifier, data.loValue) : fnFormat(data.upQualifier, data.upValue);
      }
      
      if (!!data.unit)
        out += data.unit;
      return out.replace(/ /g, "&nbsp;");
    },
    
    createCategory: function(tab, category, name) {
      var self = this;
  
      var theCat = $('.' + category + '.jtox-study', tab)[0];
      if (!theCat) {
        theCat = jToxKit.getTemplate('#jtox-study');
        tab.appendChild(theCat);
        $(theCat).addClass(category);
        
        // install the click handler for fold / unfold
        var titleEl = $('.jtox-study-title', theCat);
        $(titleEl).click(function() {
          $(theCat).toggleClass('folded');
        });
      }
      
      ccLib.fillTree(titleEl[0], { title: "" + name + " (0)"});
      return theCat;
    },
  
    updateCount: function(str, count) {
      if (count === undefined)
        count = 0;
      return str.replace(/(.+)\s\(([0-9]+)\)/, "$1 (" + count + ")");
    },
    
    
    ensureTable: function (tab, study) {
      var self = this;
  
      var theTable = $('.' + study.protocol.category + ' .jtox-study-table')[0];
      if (!$(theTable).hasClass('dataTable')) {
  
        var colDefs = [
          { "sClass": "center", "sWidth": "20%", "mData": "protocol.endpoint" } // The name (endpoint)
        ];
        
        // start filling it
        var headerRow = theTable.getElementsByClassName('jtox-header')[0];
        var before = headerRow.firstElementChild;
        var parCount = 0;
  
        // this function takes care to add as columns all elements from given array
        var putAGroup = function(group, fProcess) {
          var count = 0;
          for (var p in group) {
            var val = fProcess(p);
            if (val === undefined)
              continue;
            colDefs.push(val);
            
            var th = document.createElement('th');
            th.innerHTML = p;
            headerRow.insertBefore(th, before);
            before = th.nextElementSibling;
            count++;
          }
          return count;
        }
  
        // use it to put parameters...
        parCount += putAGroup(study.parameters, function(p) {
          return study.effects[0].conditions[p] === undefined  && study.effects[0].conditions[p + " unit"] === undefined ? 
          { 
            "sClass" : "center middle", 
            "mData" : "parameters." + p, 
            "mRender" : function (data, type, full) { return data !== undefined ? (data + ((full[p + " unit"] !== undefined) ? "&nbsp;" + full[p + " unit"] : "")) : "-"; }
          } : undefined;
        });
        // .. and conditions
        parCount += putAGroup(study.effects[0].conditions, function(c){
          return study.effects[0].conditions[c + " unit"] === undefined ?
          { "sClass" : "center middle jtox-multi", 
            "mData" : "effects", 
            "mRender" : function(data, type, full) { return self.renderMulti(data, type, full, function(data, type) { return data.conditions[c] !== undefined ? (data.conditions[c] + (data.conditions[c + " unit"] !== undefined ? "&nbsp;" + data.conditions[c + " unit"] : "")) : "-"; } )} 
          } : undefined;
        });
        
        // now fix the colspan of 'Conditions' preheader cell
        var preheaderCell = theTable.getElementsByClassName('jtox-preheader')[0].firstElementChild.nextElementSibling;
        if (parCount > 0)
          preheaderCell.setAttribute('colspan', parCount);
        else
          preheaderCell.parentNode.removeChild(preheaderCell);
        
        // add also the "default" effects columns
        colDefs.push(
          { "sClass": "center middle jtox-multi", "sWidth": "15%", "mData": "effects", "mRender": function (data, type, full) { return self.renderMulti(data, type, full, "endpoint");  } },   // Effects columns
          { "sClass": "center middle jtox-multi", "sWidth": "15%", "mData" : "effects", "mRender": function (data, type, full) { return self.renderMulti(data, type, full, self.formatResult) } }
        );
  
        // jump over those two - they are already in the DOM      
        before = before.nextElementSibling.nextElementSibling;
        
        // now is time to put interpretation columns..
        parCount = putAGroup(study.interpretation, function(i){
          return { "sClass" : "center middle jtox-multi", "mData" : "interpretation." + i, "sDefaultContent": "-"};
        });
  
        // jump over Effects preheader-column      
        preheaderCell = preheaderCell.nextElementSibling.nextElementSibling;
        if (parCount > 0)
          preheaderCell.setAttribute('colspan', parCount);
        else
          preheaderCell.parentNode.removeChild(preheaderCell);
        
        // finally put the protocol entries
        colDefs.push(
          { "sClass": "center", "sWidth": "15%", "mData": "protocol.guidance", "mRender" : "[,]", "sDefaultContent": "?"  },    // Protocol columns
          { "sClass": "center", "sWidth": "50px", "mData": "owner.company.name", "mRender" : function(data, type, full) { return type != "display" ? '' + data : '<div class="shortened">' + data + '</div>'; }  }, 
          { "sClass": "center", "sWidth": "50px", "mData": "uuid", "bSearchable": false, "mRender" : function(data, type, full) { return type != "display" ? '' + data : '<div class="shortened">' + data + '</div>'; }  }
        );
        
        // READYY! Go and prepare THE table.
        $(theTable).dataTable( {
          "bPaginate": true,
          "bProcessing": true,
          "bLengthChange": false,
  				"bAutoWidth": false,
  //        "sPaginationType": "full_numbers",
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
          var cat = self.createCategory(tab, catname, catname);
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
      for (var i = 0, slen = study.length; i < slen; ++i) {
        var ones = study[i];
        if (map) {
          if (cats[ones.protocol.category] === undefined) {
            cats[ones.protocol.category] = [ones];
          }
          else {
            cats[ones.protocol.category].push(ones);
          }
        }
      }
  
      // add this one, if we're not remapping. map == false assumes that all passed studies will be from
      // one category.    
      if (!map)
        cats[study[0].protocol.category] = study;
      
      // now iterate within all categories (if many) and initialize the tables
      for (var c in cats) {
        var onec = cats[c];
        if ($('.' + c + '.jtox-study', tab).length < 1)
          continue;
  
        var theTable = self.ensureTable(tab, onec[0]);
        $(theTable).dataTable().fnAddData(onec);
      }
      
      // we need to fix columns height's because of multi-cells
      $('#' + theTable.id + ' .jtox-multi').each(function(index){
        this.style.height = '' + this.offsetHeight + 'px';
      });
    },
    
    formatConcentration: function (precision, val, unit) {
    	return ((precision === undefined || precision === null || "=" == precision ? "" : precision) + val + " " + (unit == null ? "" : unit)).replace(/ /g, "&nbsp;");
    },
    
    processComposition: function(json){
      var self = this;
      $('.jtox-composition', self.rootElement).removeClass('unloaded');
      var theTable = $('.jtox-composition table', self.rootElement);
      if (!$(theTable).hasClass('dataTable')) {
        // prepare the table...
        $(theTable).dataTable({
  				"bSearchable": true,
  				"bProcessing" : true,
  				"bPaginate" : true,
  /* 				"sDom" : '<"help remove-bottom"i><"help"p>Trt<"help"lf>', */
  /* 				"sPaginationType": "full_numbers", */
  				"sPaginate" : ".dataTables_paginate _paging",
  				"bAutoWidth": false,
  				"oLanguage": {
  				  "sSearch": "Filter:",
            "sProcessing": "<img src='" + self.baseUrl + "images/24x24_ambit.gif' border='0'>",
            "sLoadingRecords": "No substances found.",
            "sZeroRecords": "No substances found.",
            "sEmptyTable": "No substances available.",
            "sInfo": "Showing _TOTAL_ substance(s) (_START_ to _END_)",
            "sLengthMenu": 'Display&nbsp;<select>' +
              '<option value="10">10</option>' +
              '<option value="20">20</option>' +
              '<option value="50">50</option>' +
              '<option value="100">100</option>' +
              '<option value="-1">all</option>' +
              '</select>&nbsp;substances.'	            
          },
  		    "aoColumns": [
    				{  //1
    					"sClass" : "left",
    					"sWidth" : "50px",
    					"mData" : "compositionUUID",
    					"mRender" : function(data, type, full) { return type != 'display' ? '' + data : '<div class="shortened">' + data + '</div>'; }
    				},	
            {  //2
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
    				{ //3
    					"sClass" : "camelCase left",
    					"sWidth" : "15%",
    					"mData" : "component.compound.name",
    					"mRender" : function(val, type, full) {
    						return (type != 'display') ? '' + val : 
    						  '<a href="' + full.component.compound.URI + '" target="_blank" title="Click to view the compound"><span class="ui-icon ui-icon-link" style="float: left; margin-right: .3em;"></span></a>' + val;
    					}
    				},	    	
    				{ //4
    					"sClass" : "left",
    					"sWidth" : "10%",
    					"mData" : "component.compound.einecs",
    				},
    				{ //5
    					"sClass" : "left",
    					"sWidth" : "10%",
    					"mData" : "component.compound.cas",
    				},
    				{ //6
    					"sClass" : "center",
    					"sWidth" : "15%",
    					"mData" : "proportion.typical",
    					"mRender" : function(val, type, full) { return type != 'display' ? '' + val.value : self.formatConcentration(val.precision, val.value, val.unit); }
    				},
    				{ //7
    					"sClass" : "center",
    					"sWidth" : "15%",
    					"mData" : "proportion.real",
    					"mRender" : function(val, type, full) { return type != 'display' ? '' + val.lowerValue : self.formatConcentration(val.lowerPrecision, val.lowerValue, val.unit); }
    				},
    				{ //8
    					"sClass" : "center",
    					"sWidth" : "15%",
    					"mData" : "proportion.real",
    					"mRender" : function(val, type, full) { return type != 'display' ? '' + val.upperValue : self.formatConcentration(val.upperPrecision, val.upperValue, val.unit); }
    				},			    				
    				{ //9
    					"sClass" : "center",
    					"mData" : "component.compound.URI",
    					"mRender" : function(val, type, full) {
    					  return !val ? '' : '<a href="' + self.baseUrl + 'substance?type=related&compound_uri=' + encodeURIComponent(val) + '" target="_blank">Also contained in...</a>';
    					}
  	    		}		    				
  		    ]
  		  });
      }
      else
        $(theTable).dataTable().fnClearTable();
      
      // proprocess the data...
      for (var i = 0, cmpl = json.composition.length; i < cmpl; ++i) {
        var cmp = json.composition[i];
        
  			cmp.component.compound["name"] = [];
  			cmp.component.compound["cas"] = [];
  			cmp.component.compound["einecs"] = [];
  			for (var key in cmp.component.values){
    			var value = cmp.component.values[key];
    			var feature = json.feature[key];
  				if ((feature != null) && (value != null)) {
    			  var valArr = value.trim().toLowerCase().split("|").filter(function (v) { return v !== undefined && v != null && v != ''; });
            
  			 		if (feature.sameAs == "http://www.opentox.org/api/1.1#IUPACName" || feature.sameAs == "http://www.opentox.org/api/1.1#ChemicalName")
  			 		 ccLib.mergeArrays(valArr, cmp.component.compound["name"]);
  			 		else if (feature.sameAs == "http://www.opentox.org/api/1.1#CASRN")
  			 		 ccLib.mergeArrays(valArr, cmp.component.compound["cas"]);
  			 		else if (feature.sameAs == "http://www.opentox.org/api/1.1#EINECS")
  			 		 ccLib.mergeArrays(valArr, cmp.component.compound["einecs"]);
          }
        }
      }
      
      // and fill up the table.
      $(theTable).dataTable().fnAddData(json.composition);
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
    
    querySubstance: function(substanceURI){
      var self = this;
      
      // re-initialize us on each of these calls.
      self.baseUrl = jToxKit.grabBaseUrl(substanceURI, 'substance');
      
      var rootTab = $('#jtox-substance' + self.suffix)[0];
      jToxKit.call(self, substanceURI, function(substance){
         if (!!substance && !!substance.substance && substance.substance.length > 0){
           ccLib.fillTree(rootTab, substance.substance[0]);
           self.querySummary(substanceURI);
           self.queryComposition(substanceURI);
         }
      });
    }
  }; // end of prototype
  
  return cls;
})();
