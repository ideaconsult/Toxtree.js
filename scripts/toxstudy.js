/* toxstudy.js - Study-related functions from jToxKit
 *
 * Copyright 2012-2013, IDEAconsult Ltd. http://www.ideaconsult.net/
 * Created by Ivan Georgiev
**/

var jToxStudy = (function () {
  var defaultSettings = {
    tab: null,
    sDom: "rt<Fip>",
    oLanguage: null,
    // events
    onSummary: null,    // invoked when the summary is loaded
    onComposition: null, // invoked when the
    onStudy: null,      // invoked for each loaded study
    onLoaded: null,     // invoked when the substance general info is loaded
    configuration: {
      columns: {
      	"_": {
	    		"main" : { },
	    		"parameters": { },
	    		"conditions": { },
	    		"effects": { },
	    		"protocol": { },
	    		"interpretation": { },
	    	}
    	}
    }
  };    // all settings, specific for the kit, with their defaults. These got merged with general (jToxKit) ones.
  var instanceCount = 0;

  var fnDatasetValue = function (fid, old, value, features){
		return ccLib.extendArray(old, value != null ? value.trim().toLowerCase().split("|") : [value]).filter(ccNonEmptyFilter);
  };

  // constructor
  var cls = function (root, settings) {
    var self = this;
    self.rootElement = root;
    self.instanceNo = instanceCount++;
    jT.$(root).addClass('jtox-toolkit'); // to make sure it is there even in manual initialization.

    self.settings = jT.$.extend(true, {}, defaultSettings, jT.settings, settings); // i.e. defaults from jToxStudy
    self.settings.tab = self.settings.tab || jT.settings.fullUrl.hash;
    // now we have our, local copy of settings.

    // get the main template, add it (so that jQuery traversal works) and THEN change the ids.
    // There should be no overlap, because already-added instances will have their IDs changed already...
    var tree = jT.getTemplate('#jtox-studies');
    root.appendChild(tree);
    jT.ui.changeTabsIds(tree, '_' + self.instanceNo);

    // initialize the tab structure for several versions of tabs.
    self.tabs = jT.$(tree).tabs({
      "select" : function(event, ui) {
        self.loadPanel(ui.panel);
      },
      "beforeActivate" : function(event, ui) {
        if (ui.newPanel)
          self.loadPanel(ui.newPanel[0]);
      }
    });

    // when all handlers are setup - make a call, if needed.
    if (self.settings['substanceUri'] != null) {
      self.querySubstance(self.settings['substanceUri']);
    }
  };

  // now follow the prototypes of the instance functions.
  cls.prototype = {
    loadPanel: function(panel){
      var self = this;
      if (jT.$(panel).hasClass('unloaded')){
        var uri = self.addParameters(jT.$(panel).data('jtox-uri'));
        jT.call(self, uri, function(study){
          if (!!study) {
            jT.$('.jtox-study.folded', panel).removeClass('folded');
            jT.$(panel).removeClass('unloaded').addClass('loaded');

            self.processStudies(panel, study.study, true);
            ccLib.fireCallback(self.settings.onStudy, self, study.study);
          }
        });
      }
    },

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

    createCategory: function(tab, category) {
      var self = this;

      var theCat = jT.$('.' + category + '.jtox-study', tab)[0];
      if (!theCat) {
        theCat = jT.getTemplate('#jtox-study');
        tab.appendChild(theCat);
        jT.$(theCat).addClass(category);
      }

      return theCat;
    },

    addParameters: function (summaryURI) {
      var self = this;
      var pars = ["property_uri", "top", "category"];
      for (var i = 0; i < pars.length; ++i) {
        var p = pars[i];
        if (!!self.settings[p])
          summaryURI = ccLib.addParameter(summaryURI, p + "=" + self.settings[p]);
      }

      return summaryURI;
    },

    // modifies the column title, according to configuration and returns "null" if it is marked as "invisible".
    ensureTable: function (tab, study) {
      var self = this;
      var category = study.protocol.category.code;
      var theTable = jT.$('.' + category + ' .jtox-study-table', tab)[0];
      if (!jT.$(theTable).hasClass('dataTable')) {
	      var defaultColumns = [
	        { "sTitle": "Name", "sClass": "center middle", "sWidth": "15%", "mData": "protocol.endpoint" }, // The name (endpoint)
	        { "sTitle": "Endpoint", "sClass": "center middle jtox-multi", "sWidth": "10%", "mData": "effects", "mRender": function (data, type, full) { return jT.ui.renderMulti(data, type, full, function (data, type) { return self.getFormatted(data, type, "endpoint"); }); } },   // Effects columns
	        { "sTitle": "Result", "sClass": "center middle jtox-multi", "sWidth": "10%", "mData" : "effects", "mRender": function (data, type, full) { return jT.ui.renderMulti(data, type, full, function (data, type) { return jT.ui.renderRange(data.result, null, type) }); } },
	        { "sTitle": "Text", "sClass": "center middle jtox-multi", "sWidth": "10%", "mData" : "effects", "mRender": function (data, type, full) { return jT.ui.renderMulti(data, type, full, function (data, type) { return data.result.textValue ||  '-'; }); } },
	        { "sTitle": "Guideline", "sClass": "center middle", "sWidth": "15%", "mData": "protocol.guideline", "mRender" : "[,]", "sDefaultContent": "-"  },    // Protocol columns
	        { "sTitle": "Owner", "sClass": "center middle", "sWidth": "10%", "mData": "citation.owner", "sDefaultContent": "-" },
	        { "sTitle": "Citation", "sClass": "center middle", "sWidth": "10%", "mData": "citation", "mRender": function (data, type, full) { return (data.title || "") + ' ' + (!!data.year || ""); }  },
          { "sTitle": "Reliability", "sClass": "center middle", "sWidth": "10%", "mData": "reliability", "mRender": function (data, type, full) { return data.r_value; }  },
	        { "sTitle": "UUID", "sClass": "center middle", "sWidth": "15%", "mData": "uuid", "bSearchable": false, "mRender" : function(data, type, full) { return type != "display" ? '' + data : jT.ui.shortenedData(data, "Press to copy the UUID in the clipboard"); } }
	      ];

        var colDefs = [];

        // start filling it
        var parCount = 0;

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
            var col = jT.$.extend({}, defaultColumns[i + start]);
            col = jT.ui.modifyColDef(self, col, category, group);
            if (col != null) {
              colDefs.push(col);
            }
          }
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

          col = jT.ui.modifyColDef(self, col, category, "parameters");
          if (col == null)
            return null;

          col["mRender"] = function (data, type, full) { return jT.ui.renderRange(data, full[p + " unit"], type); };
          return col;
        });
        // .. and conditions
        putAGroup(study.effects[0].conditions, function(c){
          var col = {
            "sTitle" : c,
            "sClass" : "center middle jtox-multi",
            "mData" : "effects"
          };

          col = jT.ui.modifyColDef(self, col, category, "conditions");
          if (col == null)
            return null;

          col["mRender"] = function(data, type, full) {
            return jT.ui.renderMulti(data, type, full, function(data, type) {
              return jT.ui.renderRange(data.conditions[c], data.conditions[c + " unit"], type);
            });
          };
          return col;
        });

        // add also the "default" effects columns
        putDefaults(1, 3, "effects");

        // now is time to put interpretation columns..
        putAGroup(study.interpretation, function(i){
          var col = { "sTitle": i, "sClass" : "center middle jtox-multi", "mData" : "interpretation." + i, "sDefaultContent": "-"};
          return jT.ui.modifyColDef(self, col, category, "interpretation");
        });

        // finally put the protocol entries
        putDefaults(4, 5, "protocol");

        // but before given it up - make a small sorting..
        jT.ui.sortColDefs(colDefs);

        // READYY! Go and prepare THE table.
        jT.$(theTable).dataTable( {
          "bPaginate": true,
          "bProcessing": true,
          "bLengthChange": false,
  				"bAutoWidth": false,
          "sDom" : self.settings.sDom,
          "aoColumns": colDefs,
          "fnInfoCallback": function( oSettings, iStart, iEnd, iMax, iTotal, sPre ) {
            var el = jT.$('.title .data-field', jT.$(this).parents('.jtox-study'))[0];
            el.innerHTML = jT.ui.updateCounter(el.innerHTML, iTotal);
            return sPre;
          },
          "fnCreatedRow": function( nRow, aData, iDataIndex ) {
            ccLib.equalizeHeights.apply(window, jT.$('td.jtox-multi table tbody', nRow).toArray());
          },

  				"oLanguage": jT.$.extend({
            "sProcessing": "<img src='" + (jT.settings.baseUrl || self.baseUrl) + "/images/24x24_ambit.gif' border='0'>",
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
          }, self.settings.oLanguage)
        });

        jT.$(theTable).dataTable().fnAdjustColumnSizing();
      }
      else
        jT.$(theTable).dataTable().fnClearTable();

      return theTable;
    },

    processSummary: function (summary) {
      var self = this;
      var typeSummary = {};
      var knownNames = { "P-CHEM": "P-Chem", "ENV_FATE" : "Env Fate", "ECOTOX" : "Eco Tox", "TOX" : "Tox"};

      // first - clear all existing tabs
			jT.$('.jtox-study', self.rootElement).remove();

      // create the groups on the corresponding tabs, first sorting them alphabetically
      summary.sort(function (a, b) {
      	var valA = (a.category.order || a.category.description || a.category.title);
      	var valB = (b.category.order || b.category.description || b.category.title);
      	if (valA == null)
      		return -1;
      	if (valB == null)
      		return 1;
        if (valA == valB)
          return 0;
	      return (valA < valB) ? -1 : 1;
      });

      var tabRoot = $('ul', self.rootElement).parent()[0];
      var added = 0;
      var lastAdded = null;
      var addStudyTab = function (top, sum) {
        var tab = jT.getTemplate('#jtox-study-tab');
        var link = jT.ui.addTab(tabRoot, (knownNames[top] || sum.topcategory.title) + " (0)", "jtox-" + top.toLowerCase() + '_' + self.instanceNo, tab).tab;
        jT.$(link).data('type', top);

        jT.$(tab).addClass(top).data('jtox-uri', sum.topcategory.uri);
        ccLib.fillTree(tab, self.substance);

        added++;
        lastAdded = top;

        jT.$('div.jtox-study-tab div button', tabRoot).on('click', function (e) {
        	var par = jT.$(this).parents('.jtox-study-tab')[0];
    	    if (jT.$(this).hasClass('expand-all')) {
    		    jT.$('.jtox-foldable', par).removeClass('folded');
    	    }
    	    else if (jT.$(this).hasClass('collapse-all')) {
    		    jT.$('.jtox-foldable', par).addClass('folded');
    	    }
        });

        return tab;
      };

      for (var si = 0, sl = summary.length; si < sl; ++si) {
        var sum = summary[si];
        var top = sum.topcategory.title;
        if (!top)
          continue;
        var top = top.replace(/ /g, "_");
        var tab = jT.$('.jtox-study-tab.' + top, self.rootElement)[0];
        if (!tab)
          tab = addStudyTab(top, sum);

        var catname = sum.category.title;
        if (!catname)
          typeSummary[top] = sum.count;
        else
          self.createCategory(tab, catname);
      }

      // a small hack to force openning of this, later in the querySummary()
      if (added == 1)
        self.settings.tab = lastAdded;

      // update the number in the tabs...
      jT.$('ul li a', self.rootElement).each(function (i){
        var data = jT.$(this).data('type');
        if (!!data){
          var cnt = typeSummary[data];
          var el = jT.$(this)[0];
          el.innerHTML = jT.ui.updateCounter(el.innerHTML, cnt);
        }
      });

      // now install the filter box handler. It delays the query a bit and then spaws is to all tables in the tab.
      var filterTimeout = null;
      var fFilter = function (ev) {
        if (!!filterTimeout)
          clearTimeout(filterTimeout);

        var field = ev.currentTarget;
        var tab = jT.$(this).parents('.jtox-study-tab')[0];

        filterTimeout = setTimeout(function() {
          var tabList = jT.$('.jtox-study-table', tab);
          for (var t = 0, tlen = tabList.length; t < tlen; ++t) {
            jT.$(tabList[t]).dataTable().fnFilter(field.value);
          }
        }, 300);
      };

      var tabList = jT.$('.jtox-study-tab');
      for (var t = 0, tlen = tabList.length;t < tlen; t++){
        var filterEl = jT.$('.jtox-study-filter', tabList[t])[0].onkeydown = fFilter;
      }
    },

    processStudies: function (tab, study, map) {
      var self = this;
      var cats = {};
      var cntCats = 0;

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
            if (cats[ones.protocol.category.code] === undefined) {
              cats[ones.protocol.category.code] = [ones];
              cntCats++;
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
        var aStudy = jT.$('.' + c + '.jtox-study', tab)[0];
        if (aStudy === undefined)
          continue;

        ccLib.fillTree(aStudy, {title: onec[0].protocol.category.title + " (0)"});

        // now swipe through all studyies to build a "representative" one with all fields.
        var study = {};
        for (var i = 0, cl = onec.length; i < cl; ++i) {
          jT.$.extend(true, study, onec[i]);
          if (!ccLib.isEmpty(study.parameters) && !ccLib.isEmpty(study.effects[0].conditions))
            break;
        }

        var theTable = self.ensureTable(tab, study);
        jT.$(theTable).dataTable().fnAddData(onec);
        jT.$(theTable).colResizable({ minWidth: 30, liveDrag: true });
        if (cntCats > 1)
          jT.$(theTable).parents('.jtox-study').addClass('folded');

        // we need to fix columns height's because of multi-cells
        jT.$('#' + theTable.id + ' .jtox-multi').each(function(index){
          this.style.height = '' + this.offsetHeight + 'px';
        });
      }
    },

    querySummary: function(summaryURI) {
      var self = this;

      summaryURI = self.addParameters(summaryURI);
      jT.call(self, summaryURI, function(summary) {
        if (!!summary && !!summary.facet)
          self.processSummary(summary.facet);
          ccLib.fireCallback(self.settings.onSummary, self, summary.facet);
          // check if there is an initial tab passed so we switch to it
          if (!!self.settings.tab) {
            var div = jT.$('.jtox-study-tab.' + decodeURIComponent(self.settings.tab).replace(/ /g, '_').toUpperCase(), self.root)[0];
            if (!!div) {
              for (var idx = 0, cl = div.parentNode.children.length; idx < cl; ++idx)
                if (div.parentNode.children[idx].id == div.id)
                  break;
              --idx;
              jT.$(self.tabs).tabs('option', 'active', idx);
              jT.$(self.tabs).tabs('option', 'selected', idx);
            }
          }
      });
    },

    insertComposition: function(compositionURI) {
      var compRoot = jT.$('.jtox-compo-tab', this.rootElement)[0];
      jT.$(compRoot).empty();
      new jToxComposition(compRoot, jT.$.extend({}, this.settings, jT.blankSettings, {'compositionUri': compositionURI}));
    },

    querySubstance: function(substanceURI) {
      var self = this;

      // re-initialize us on each of these calls.
      self.baseUrl = ccLib.isNull(self.settings.baseUrl) ? jT.grabBaseUrl(substanceURI) : self.settings.baseUrl;

      jT.call(self, substanceURI, function(substance){
        if (!!substance && !!substance.substance && substance.substance.length > 0){
          substance = substance.substance[0];

          substance["showname"] = substance.publicname || substance.name;
          substance["IUCFlags"] = jToxSubstance.formatExtIdentifiers(substance.externalIdentifiers, 'display', substance);
          self.substance = substance;

          ccLib.fillTree(self.rootElement, substance);
          // go and query for the reference query
          jT.call(self, substance.referenceSubstance.uri, function (dataset){
            if (!!dataset) {
              jToxCompound.processDataset(dataset, null, fnDatasetValue);
              ccLib.fillTree(jT.$('.jtox-substance', self.rootElement)[0], dataset.dataEntry[0]);
            }
          });

          ccLib.fireCallback(self.settings.onLoaded, self, substance.substance);
          // query for the summary and the composition too.
          self.querySummary(substance.URI + "/studysummary");
          self.insertComposition(substance.URI + "/composition");
        }
        else
          ccLib.fireCallback(self.settings.onLoaded, self, null);
      });
    },

    query: function (uri) {
      this.querySubstance(uri);
    }
  }; // end of prototype

  return cls;
})();
