/* toxcompound.js - General, universal compound dataset visualizer.
 *
 * Copyright 2012-2013, IDEAconsult Ltd. http://www.ideaconsult.net/
 * Created by Ivan Georgiev
**/

var jToxCompound = (function () {
  var defaultSettings = { // all settings, specific for the kit, with their defaults. These got merged with general (jToxKit) ones.
    "showTabs": true,         // should we show tabs with groups, or not
    "showExport": true,       // should we add export tab up there
    "showControls": true,     // should we show the pagination/navigation controls.
    "hideEmpty": false,       // whether to hide empty groups instead of making them inactive
    "hasDetails": true,       // whether browser should provide the option for per-item detailed info rows.
    "pageSize": 20,           // what is the default (startint) page size.
    "pageStart": 0,           // what is the default startint point for entries retrieval
    "rememberChecks": false,  // whether to remember feature-checkbox settings between queries
    "metricFeature": "http://www.opentox.org/api/1.1#Similarity",   // This is the default metric feature, if no other is specified
    "onLoaded": null,         // invoked when a set of compound is loaded.
    "onPrepared": null,       // invoked when the initial call for determining the tabs/columns is ready
    "fnAccumulate": function(fId, oldVal, newVal, features) {
      if (ccLib.isNull(newVal))
        return oldVal;
      newVal = newVal.toString();
      if (ccLib.isNull(oldVal) || newVal.toLowerCase().indexOf(oldVal.toLowerCase()) >= 0)
        return newVal;
      if (oldVal.toLowerCase().indexOf(newVal.toLowerCase()) >= 0)
        return oldVal;
      return oldVal + ", " + newVal;
    },
    "configuration": {
      "groups": {
        "Identifiers" : [
          "http://www.opentox.org/api/1.1#Diagram", 
          "http://www.opentox.org/api/1.1#CASRN", 
          "http://www.opentox.org/api/1.1#EINECS",
          "http://www.opentox.org/api/1.1#IUCLID5_UUID"
        ],
        
        "Names": [
          "http://www.opentox.org/api/1.1#ChemicalName",
          "http://www.opentox.org/api/1.1#TradeName",
          "http://www.opentox.org/api/1.1#IUPACName",
          "http://www.opentox.org/api/1.1#SMILES",
          "http://www.opentox.org/api/1.1#InChIKey",
          "http://www.opentox.org/api/1.1#InChI",
          "http://www.opentox.org/api/1.1#REACHRegistrationDate"
        ],
        
        "Calculated": function (name, miniset) {
          var arr = [];
          if (miniset.dataEntry.length > 0 && !ccLib.isNull(miniset.dataEntry[0].compound.metric))
            arr.push(this.settings.metricFeature);

          for (var f in miniset.features) {
            var feat = miniset.features[f];
            if (ccLib.isNull(feat.source) || ccLib.isNull(feat.source.type) || !!feat.basic)
              continue;
            else if (feat.source.type.toLowerCase() == "algorithm" || feat.source.type.toLowerCase() == "model") {
              arr.push(f);
            }
          }
          return arr;
        },
        
        "Other": function (name, miniset) {
          var arr = [];
          for (var f in miniset.features) {
            if (!miniset.features[f].used && !miniset.features[f].basic)
              arr.push(f);
          }
          return arr;
        }
      },
      "exports": [
        {type: "chemical/x-mdl-sdfile", icon: "images/sdf64.png"},
        {type: "chemical/x-cml", icon: "images/cml64.png"},
        {type: "chemical/x-daylight-smiles", icon: "images/smi64.png"},
        {type: "chemical/x-inchi", icon: "images/inchi64.png"},
        {type: "text/uri-list", icon: "images/lnk64.png"},
        {type: "application/pdf", icon: "images/pdf64.png"},
        {type: "text/csv", icon: "images/csv64.png"},
        {type: "text/plain", icon: "images/txt64.png"},
        {type: "text/x-arff", icon: "images/arff.png"},
        {type: "text/x-arff-3col", icon: "images/arff-3.png"},
        {type: "application/rdf+xml", icon: "images/rdf64.png"},
        {type: "application/json", icon: "images/json64.png"}
      ],

      // These are instance-wide pre-definitions of default baseFeatures as described below.
      "baseFeatures": {
      	// and one for unified way of processing diagram
      	"http://www.opentox.org/api/1.1#Diagram": {title: "Diagram", search: false,
      	  process: function(entry, fId, features) {
            entry.compound.diagramUri = entry.compound.URI.replace(/(.+)(\/conformer.*)/, "$1") + "?media=image/png";
      	  },
      	  render: function(col, fId){
      	    col["mData"] = "compound.diagramUri";
            col["mRender"] = function(data, type, full) {
              return (type != "display") ? "-" : '<a target="_blank" href="' + full.compound.URI + '"><img src="' + data + '" class="jtox-ds-smalldiagram"/></a>';
            };
            col["sClass"] = "paddingless";
            col["sWidth"] = "125px";
            return col;
        	},
        	visibility: "main"
      	},
      	"http://www.opentox.org/api/1.1#Similarity": {title: "Similarity", location: "compound.metric", search: true, used: true},
      }
    }
  };

  /* define the standard features-synonymes, working with 'sameAs' property. Beside the title we define the 'location' property
  as well which is used in processEntry() to location value(s) from given (synonym) properties into specific property of the compound entry itself.
  'location' can be an array, which results in adding value to several places.
  */
  var baseFeatures = {
    "http://www.opentox.org/api/1.1#REACHRegistrationDate" : { title: "REACH Date", location: "compound.reachdate", accumulate: true, basic: true},
    "http://www.opentox.org/api/1.1#CASRN" : { title: "CAS", location: "compound.cas", accumulate: true, basic: true},
  	"http://www.opentox.org/api/1.1#ChemicalName" : { title: "Name", location: "compound.name", accumulate: true, basic: true},
  	"http://www.opentox.org/api/1.1#TradeName" : {title: "Trade Name", location: "compound.tradename", accumulate: true, basic: true},
  	"http://www.opentox.org/api/1.1#IUPACName": {title: "IUPAC Name", location: ["compound.name", "compound.iupac"], accumulate: true, basic: true},
  	"http://www.opentox.org/api/1.1#EINECS": {title: "EINECS", location: "compound.einecs", accumulate: true, basic: true},
    "http://www.opentox.org/api/1.1#InChI": {title: "InChI", location: "compound.inchi", shorten: true, accumulate: true, basic: true},
  	"http://www.opentox.org/api/1.1#InChI_std": {title: "InChI", location: "compound.inchi", shorten: true, accumulate: true, used: true, basic: true},
    "http://www.opentox.org/api/1.1#InChIKey": {title: "InChI Key", location: "compound.inchikey", accumulate: true, basic: true},
  	"http://www.opentox.org/api/1.1#InChIKey_std": {title: "InChI Key", location: "compound.inchikey", accumulate: true, used: true, basic: true},
    "http://www.opentox.org/api/1.1#InChI_AuxInfo": {title: "InChI Aux", location: "compound.inchi", accumulate: true, used: true, basic: true},
  	"http://www.opentox.org/api/1.1#InChI_AuxInfo_std": {title: "InChI Aux", location: "compound.inchi", accumulate: true, used:true, basic: true},
  	"http://www.opentox.org/api/1.1#IUCLID5_UUID": {title: "IUCLID5 UUID", location: "compound.i5uuid", shorten: true, accumulate: true, basic: true},
  	"http://www.opentox.org/api/1.1#SMILES": {title: "SMILES", location: "compound.smiles", shorten: true, accumulate: true, basic: true},
  	"http://www.opentox.org/api/dblinks#CMS": {title: "CMS", accumulate: true, basic: true},
  	"http://www.opentox.org/api/dblinks#ChEBI": {title: "ChEBI", accumulate: true, basic: true},
  	"http://www.opentox.org/api/dblinks#Pubchem": {title: "PubChem", accumulate: true, basic: true},
  	"http://www.opentox.org/api/dblinks#ChemSpider": {title: "ChemSpider", accumulate: true, basic: true},
  	"http://www.opentox.org/api/dblinks#ChEMBL": {title: "ChEMBL", accumulate: true, basic: true},
  	"http://www.opentox.org/api/dblinks#ToxbankWiki": {title: "Toxbank Wiki", accumulate: true, basic: true},
  };
  var instanceCount = 0;

  // constructor
  var cls = function (root, settings) {
    var self = this;
    self.rootElement = root;
    jT.$(root).addClass('jtox-toolkit'); // to make sure it is there even in manual initialization.
    
    var newDefs = jT.$.extend(true, { "configuration" : { "baseFeatures": baseFeatures} }, defaultSettings);
    self.settings = jT.$.extend(true, {}, newDefs, jT.settings, settings); // i.e. defaults from jToxCompound
    self.instanceNo = instanceCount++;
    if (self.settings.rememberChecks && self.settings.showTabs)
      self.featureStates = {};

    // finally make the query, if Uri is provided      
    if (self.settings['datasetUri'] !== undefined){
      self.queryDataset(self.settings['datasetUri']);
    }
  };
  
  // now follow the prototypes of the instance functions.
  cls.prototype = {
    init: function () {
      var self = this;
      
      self.features = null; // features, as downloaded from server, after being processed.
      self.dataset = null; // the last-downloaded dataset.
      self.groups = null; // computed groups, i.e. 'groupName' -> array of feature list, prepared.
      self.fixTable = self.varTable = null; // the two tables - to be initialized in prepareTables.
      self.entriesCount = null;
      self.suspendEqualization = false;
      self.orderList = [];
      self.usedFeatures = [];
      
      self.rootElement.appendChild(jT.getTemplate('#jtox-compound'));
      
      jT.ui.putControls(self, { 
        nextPage: function () { self.nextPage(); },
        prevPage: function () { self.prevPage(); },
        sizeChange: function() { self.queryEntries(self.settings.pageStart, parseInt(jT.$(this).val())); },
        filter: function () { self.updateTables() }
      });
    },
    
    clearDataset: function () {
      if (this.usedFeatures !== undefined) {      
        jT.$(this.rootElement).empty();
        for (var i = 0, fl = this.usedFeatures.length; i < fl; ++i) {
          var fid = this.usedFeatures[i];
          this.features[fid].used = false;
        }
      }
    },
    
    /* make a tab-based widget with features and grouped on tabs. It relies on filled and processed 'self.features' as well
    as created 'self.groups'.
    */
    prepareTabs: function (root, isMain, nodeFn, divFn) {
      var self = this;
      
      var all = document.createElement('div');
      all.style.display = "none"; // we suppress the re-layouting engine this way, we'll show it at the end.
      root.appendChild(all);
      ulEl = document.createElement('ul');
      all.appendChild(ulEl);

      var createATab = function(grId, name) {
        var liEl = document.createElement('li');
        ulEl.appendChild(liEl);
        var aEl = document.createElement('a');
        aEl.href = "#" + grId;
        aEl.innerHTML = name;
        liEl.appendChild(aEl);
        return liEl;
      };
      
      var emptyList = [];
      var idx = 0;
      for (var gr in self.groups) {
        var grId = "jtox-ds-" + gr.replace(/\s/g, "_") + "-" + self.instanceNo;
        var tabLi = createATab(grId, gr.replace(/_/g, " "));
        
        // now prepare the content...
        var divEl = document.createElement('div');
        divEl.id = grId;
        all.appendChild(divEl);
        
        // .. check if we have something else to add in between
        if (typeof divFn == 'function')
          divEl = divFn(gr, divEl); // it's expected to attach it

        // ... and fill it.
        var grp = self.groups[gr];
        var empty = true;
        ccLib.enumObject(self.groups[gr], function (fId, idx, level) {
          var vis = (self.features[fId] || {})['visibility'];
          if (!!vis && (vis == "none" || (!isMain && vis == 'main') || (isMain && vis == "details")))
            return;
          empty = false;
          if (idx == "name") {
            if (isMain) {
              var fEl = nodeFn(null, fId, divEl);
              if (self.settings.rememberChecks)
                jT.$('input[type="checkbox"]', fEl)[0].checked = (self.featureStates[fId] === undefined || self.featureStates[fId]);
            }
          }
          else if (!isMain || level == 1) {
            var title = self.features[fId].title;
            if (!ccLib.isNull(title)) {
              var fEl = nodeFn(fId, title, divEl);
              if (isMain && self.settings.rememberChecks)
                jT.$('input[type="checkbox"]', fEl)[0].checked = (self.featureStates[fId] === undefined || self.featureStates[fId]);
            }
          }
        });

        if (empty) {
          if (self.settings.hideEmpty) {
            jT.$(divEl).remove();
            jT.$(tabLi).remove();
            --idx;
          }
          else
            emptyList.push(idx);
        }
        ++idx;
      }
      
      if (isMain && self.settings.showExport) {
        var tabId = "jtox-ds-export-" + self.instanceNo;
        var liEl = createATab(tabId, "Export");
        jT.$(liEl).addClass('jtox-ds-export');
        var divEl = jT.getTemplate('#jtox-ds-export')
        divEl.id = tabId;
        all.appendChild(divEl);
        divEl = jT.$('.jtox-exportlist', divEl)[0];
        
        for (var i = 0, elen = self.settings.configuration.exports.length; i < elen; ++i) {
          var expo = self.settings.configuration.exports[i];
          var el = jT.getTemplate('#jtox-ds-download');
          divEl.appendChild(el);
          
          jT.$('a', el)[0].href = ccLib.addParameter(self.datasetUri, "media=" + encodeURIComponent(expo.type));
          var img = el.getElementsByTagName('img')[0];
          img.alt = img.title = expo.type;
          img.src = (jT.settings.baseUrl || self.settings.baseUrl) + '/' + expo.icon;
        }
      }
      
      // now show the whole stuff and mark the disabled tabs
      all.style.display = "block";
      return jT.$(all).tabs({ collapsible: isMain, disabled: emptyList, heightStyle: isMain ? "content" : "fill" });
    },
    
    equalizeTables: function () {
      var self = this;
      if (!self.suspendEqualization && self.fixTable != null && self.varTable != null) {
        ccLib.equalizeHeights(self.fixTable.tHead, self.varTable.tHead);
        ccLib.equalizeHeights(self.fixTable.tBodies[0], self.varTable.tBodies[0]);
      }
    },
    
    featureValue: function (fId, data) {
      var self = this;
      var feature = self.features[fId];
      if (feature.location !== undefined)
        return ccLib.getJsonValue(data, jT.$.isArray(feature.location) ? feature.location[0] : feature.location);
      else
        return data.values[fId];
    },
    
    featureUri: function (fId) {
      var self = this;
      var origId = self.features[fId].originalId;
      return ccLib.isNull(origId) ? fId : origId;
    },
    
    prepareTables: function() {
      var self = this;
      var varCols = [];
      var fixCols = [];
      
      var colList = fixCols;
      // enter the first column - the number.
      
      fixCols.push({
          "mData": "number",
          "sClass": "middle",
          "mRender": function (data, type, full) { 
            return (type != "display") ?
              '' + data : 
              "&nbsp;-&nbsp;" + data + "&nbsp;-&nbsp;<br/>" + 
                (self.settings.hasDetails ?              
                  '<span class="jtox-details-open ui-icon ui-icon-circle-triangle-e" title="Press to open/close detailed info for this compound"></span>'
                  : '');
          }
        },
        { "sClass": "jtox-hidden", "mData": "index", "sDefaultContent": "-", "bSortable": true, "mRender": function(data, type, full) { return ccLib.isNull(self.orderList) ? 0 : self.orderList[data]; } }, // column used for ordering
        { "sClass": "jtox-hidden jtox-ds-details paddingless", "mData": "index", "sDefaultContent": "-", "mRender": function(data, type, full) { return ''; } } // details column
      );
      
      varCols.push({ "sClass": "jtox-hidden jtox-ds-details paddingless", "mData": "index", "mRender": function(data, type, full) { return ''; }  });

      // prepare the function for column switching...      
      var fnShowColumn = function() {
        var dt = $(this).data();
        var cells = jT.$(dt.sel + ' table tr>*:nth-child(' + (dt.idx + 1) + ')', self.rootElement);
        if (this.checked)
          jT.$(cells).show();
        else
          jT.$(cells).hide();
        if (self.settings.rememberChecks)
          self.featureStates[dt.id] = this.checked;
        self.equalizeTables();
      };
      
      var fnExpandCell = function (cell, expand) {
        var cnt = 0;
        for (var c = cell;c; c = c.nextElementSibling, ++cnt)
          jT.$(c).toggleClass('jtox-hidden');

        if (expand)
          cell.setAttribute('colspan', '' + cnt);
        else 
          cell.removeAttribute('colspan');
      };
      
      var fnShowDetails = (self.settings.hasDetails ? function(row) {
        var cell = jT.$(".jtox-ds-details", row)[0];
        var idx = jT.$(row).data('jtox-index');
        jT.$(row).toggleClass('jtox-detailed-row');
        var toShow = jT.$(row).hasClass('jtox-detailed-row');

        // now go and expand both fixed and variable table details' cells.
        fnExpandCell(cell, toShow);
        var varCell = document.getElementById('jtox-var-' + self.instanceNo + '-' + idx).firstElementChild;
        fnExpandCell(varCell, toShow);
        
        var iconCell = jT.$('.jtox-details-open', row);
        jT.$(iconCell).toggleClass('ui-icon-circle-triangle-e');
        jT.$(iconCell).toggleClass('ui-icon-circle-triangle-w');

        if (toShow) {
          // i.e. we need to show it - put the full sized diagram in the fixed part and the tabs in the variable one...
          var full = self.dataset.dataEntry[idx];
          
          var detDiv = document.createElement('div');
          varCell.appendChild(detDiv);
          
          var img = new Image();
          img.onload = function(e) {
            self.equalizeTables();
            jT.$(detDiv).height(varCell.parentNode.clientHeight - 1);
            self.prepareTabs(detDiv, false, 
              function (id, name, parent) {
                var fEl = null;
                if (id != null) {
                  fEl = jT.getTemplate('#jtox-one-detail');
                  parent.appendChild(fEl);
                  ccLib.fillTree(fEl, {title: name, value: self.featureValue(id, full), uri: self.featureUri(id)});
                }
                return fEl;
              },
              function (id, parent) {
                var tabTable = jT.getTemplate('#jtox-details-table');
                parent.appendChild(tabTable);
                return tabTable;  
              }
            );
          };
          img.src = full.compound.diagramUri;
          cell.appendChild(img);
        }
        else {
          // i.e. we need to hide
          jT.$(cell).empty();
          jT.$(varCell).empty();
          self.equalizeTables();
        }
      } : null); // fnShowDetails definition end

      // make a query for all checkboxes in the main tab, so they can be traversed in parallel with the features and 
      // a change handler added.
      var checkList = jT.$('.jtox-ds-features .jtox-checkbox', self.rootElement);
      var checkIdx = -1;
      
      // now proceed to enter all other columns
      for (var gr in self.groups) {
        ccLib.enumObject(self.groups[gr], function (fId, idx, level) {
          if (idx == "name") {
            ++checkIdx;
            return;
          }
            
          var feature = self.features[fId];
          var col = {
            "sTitle": feature.title.replace(/_/g, ' ') + (ccLib.isNull(feature.units) ? "" : feature.units),
            "sDefaultContent": "-",
          };
          
          if (feature.location !== undefined)
            col["mData"] = feature.location;
          else {
            col["mData"] = 'values';
            col["mRender"] = (function(featureId) { return function(data, type, full) { var val = data[featureId]; return ccLib.isEmpty(val) ? '-' : val }; })(fId);
          }
          
          // some special cases, like diagram
          if (feature.render !== undefined) 
            col = ccLib.fireCallback(feature.render, self, col, fId);
          
          if (!!feature.shorten) {
            col["mRender"] = function(data, type, full) {
              return (type != "display") ? '' + data : jT.ui.shortenedData(data, "Press to copy the value in the clipboard");
            };
            col["sWidth"] = "75px";
          }
          
          // finally - assign column switching to the checkbox of main tab.
          if (level == 1)
            ++checkIdx;
          jT.$(checkList[checkIdx]).data({ sel: colList == fixCols ? '.jtox-ds-fixed' : '.jtox-ds-variable', idx: colList.length, id: fId}).on('change', fnShowColumn)
          
          // and push it into the proper list.
          colList.push(col);
        });
        
        // after the first one we switch to variable table's columns.
        colList = varCols;
      }
      
      // now - create the tables...
      self.fixTable = (jT.$(".jtox-ds-fixed table", self.rootElement).dataTable({
        "bPaginate": false,
        "bProcessing": true,
        "bLengthChange": false,
				"bAutoWidth": true,
        "sDom" : "rt",
        "aoColumns": fixCols,
        "bSort": false,
        "fnCreatedRow": function( nRow, aData, iDataIndex ) {
          // attach the click handling
          if (self.settings.hasDetails)
            jT.$('.jtox-details-open', nRow).on('click', function(e) {  fnShowDetails(nRow); });
          jT.$(nRow).data('jtox-index', iDataIndex);
        },
        "oLanguage" : {
          "sEmptyTable" : '<span id="jtox-ds-message-' + self.instanceNo + '">Loading data...</span>',
        }
      }))[0];

      self.varTable = (jT.$(".jtox-ds-variable table", self.rootElement).dataTable({
        "bPaginate": false,
        "bLengthChange": false,
				"bAutoWidth": false,
        "sDom" : "rt",
        "bSort": true,
        "aoColumns": varCols,
        "bScrollCollapse": true,
        "fnCreatedRow": function( nRow, aData, iDataIndex ) {
          nRow.id = 'jtox-var-' + self.instanceNo + '-' + iDataIndex;
          jT.$(nRow).addClass('jtox-row');
          jT.$(nRow).data('jtox-index', iDataIndex);
        },
        "fnDrawCallback": function(oSettings) {
          // this is for synchro-sorting the two tables
          var sorted = jT.$('.jtox-row', this);
          for (var i = 0, rlen = sorted.length;i < rlen; ++i) {
            var idx = jT.$(sorted[i]).data('jtox-index');
            self.orderList[idx] = i;
          }
          
          if (rlen > 0)
            jT.$(self.fixTable).dataTable().fnSort([[1, "asc"]]);
        },
        "oLanguage" : { "sEmptyTable" : " - " }
      }))[0];
    },

    updateTables: function() {
      var self = this;
      self.filterEntries(jT.$('.jtox-controls input', self.rootElement).val());
    },
    
    /* Prepare the groups and the features.
    */
    prepareGroups: function (miniset) {
      var self = this;
      
      var grps = self.settings.configuration.groups;
      self.groups = {};
      for (var i in grps){
        var grp = grps[i];
        if (ccLib.isNull(grp))
          continue;
          
        var grpArr = (typeof grp == "function" || typeof grp == "string") ? ccLib.fireCallback(grp, self, i, miniset) : grp;
        self.groups[i] = [];
        ccLib.enumObject(grpArr, function(fid, idx) { 
          var sameAs = cls.findSameAs(fid, self.features);
          if (!self.features[sameAs].used && !self.features[fid].used)
            self.groups[i].push(fid);
          if (idx != "name") {
            // these we need to be able to return back to original state.
            self.usedFeatures.push(fid);
            self.usedFeatures.push(sameAs);
            self.features[fid].used = self.features[sameAs].used = true;
          }
        });
      }
    },
    
    /* Enumerate all recofnized features, caling fnMatch(featureId, groupId) for each of it. 
    Return true from the function to stop enumeration, which in turn will return true if it was stopped.
    */
    enumerateFeatures: function(fnMatch) {
      var self = this;
      var stopped = false;
      for (var gr in self.groups) {
        for (var i = 0, glen = self.groups[gr].length;i < glen; ++i) {
          if (stopped = fnMatch(self.groups[gr][i], gr))
            break;
        }
        
        if (stopped)
          break;
      }
      
      return stopped;
    },
    
    filterEntries: function(needle) {
      var self = this;
      
      if (ccLib.isNull(needle))
        needle = '';
      else
        needle = needle.toLowerCase();
        
      var dataFeed = [];
      if (needle != '') {
        for (var i = 0, slen = self.dataset.dataEntry.length;i < slen; ++i){
          var entry = self.dataset.dataEntry[i];
  
          var match = self.enumerateFeatures(function(fId, gr){
            var feat = self.features[fId];
            if (feat.search !== undefined && !feat.search)
              return false;
            var val = self.featureValue(fId, entry);
            return !ccLib.isNull(val) && val.toString().toLowerCase().indexOf(needle) >= 0;
          });
          
            
          if (match)
            dataFeed.push(entry);
        }
      }
      else {
        dataFeed = self.dataset.dataEntry;
      }
      
      jT.$(self.fixTable).dataTable().fnClearTable();
      jT.$(self.varTable).dataTable().fnClearTable();
      jT.$(self.fixTable).dataTable().fnAddData(dataFeed);
      jT.$(self.varTable).dataTable().fnAddData(dataFeed);
      jT.$('#jtox-ds-message-' + self.instanceNo).html('No records matching the filter.');
      
      if (self.settings.showTabs){
        self.suspendEqualization = true;
        jT.$('.jtox-ds-features .jtox-checkbox', self.rootElement).trigger('change');     
        self.suspendEqualization = false;
      }
      
      // finally
      self.equalizeTables();
    },
    
    // These two are shortcuts for calling the queryEntries routine
    nextPage: function() {
      var self = this;
      if (self.entriesCount == null || self.settings.pageStart + self.settings.pageSize < self.entriesCount)
        self.queryEntries(self.settings.pageStart + self.settings.pageSize);
    },
    
    prevPage: function() {
      var self = this;
      if (self.settings.pageStart > 0)
        self.queryEntries(self.settings.pageStart - self.settings.pageSize);
    },
    
    updateControls: function (qStart, qSize) {
      var self = this;

      // first initialize the counters.
      qStart = self.settings.pageStart = qStart * self.settings.pageSize;
      if (qSize < self.settings.pageSize) // we've reached the end!!
        self.entriesCount = qStart + qSize;
      
      if (self.settings.showControls){
        var pane = jT.$('.jtox-controls', self.rootElement)[0];
        ccLib.fillTree(pane, {
          "pagestart": qStart + 1,
          "pageend": qStart + qSize,
        });
        
        var nextBut = jT.$('.next-field', pane);
        if (self.entriesCount == null || qStart + qSize < self.entriesCount)
          jT.$(nextBut).addClass('paginate_enabled_next').removeClass('paginate_disabled_next');
        else
          jT.$(nextBut).addClass('paginate_disabled_next').removeClass('paginate_enabled_next');
          
        var prevBut = jT.$('.prev-field', pane);
        if (qStart > 0)
          jT.$(prevBut).addClass('paginate_enabled_previous').removeClass('paginate_disabled_previous');
        else
          jT.$(prevBut).addClass('paginate_disabled_previous').removeClass('paginate_enabled_previous');
      }
    },
    
    // make the actual query for the (next) portion of data.
    queryEntries: function(from, size) {
      var self = this;
      if (from < 0)
        from = 0;
      if (size == null)
        size = self.settings.pageSize;
        
      // setup the size, as well
      jT.$('.jtox-controls select', self.rootElement).val(size);
      self.settings.pageSize = size;
      
      var qStart = Math.floor(from / size);
      var qUri = ccLib.addParameter(self.datasetUri, "page=" + qStart + "&pagesize=" + size);

      jT.call(self, qUri, function(dataset){
        if (!!dataset){
          // then, preprocess the dataset
          self.dataset = cls.processDataset(dataset, self.features, self.settings.fnAccumulate, self.settings.pageStart);

          // ok - go and update the table, filtering the entries, if needed            
          self.updateTables();

          // finally - go and update controls if they are visible
          self.updateControls(qStart, dataset.dataEntry.length);

          // time to call the supplied function, if any.
          ccLib.fireCallback(self.settings.onLoaded, self, dataset);
        }
      });
    },
    
    /* Makes a query to the server for particular dataset, asking for feature list first, so that the table(s) can be 
    prepared.
    */
    queryDataset: function (datasetUri) {
      var self = this;
      // if some oldies exist...
      this.clearDataset();
      this.init();

      datasetUri = jT.grabPaging(self, datasetUri);

      self.settings.baseUrl = self.settings.baseUrl || jT.grabBaseUrl(datasetUri);
      
      // remember the _original_ datasetUri and make a call with one size length to retrieve all features...
      self.datasetUri = datasetUri;
      jT.call(self, ccLib.addParameter(datasetUri, "page=0&pagesize=1"), function (dataset) {
        if (!!dataset) {
          self.features = dataset.feature;
          cls.processFeatures(self.features, self.settings.configuration.baseFeatures);
          dataset.features = self.features;
          self.prepareGroups(dataset);
          if (self.settings.showTabs) {
            self.prepareTabs(jT.$('.jtox-ds-features', self.rootElement)[0], true, function (id, name, parent){
              var fEl = jT.getTemplate('#jtox-ds-feature');
              parent.appendChild(fEl);
              ccLib.fillTree(fEl, {title: name.replace(/_/g, ' '), uri: self.featureUri(id)});
              return fEl;
            });
          }
          
          self.prepareTables(); // prepare the tables - we need features to build them - we have them!
          self.equalizeTables(); // to make them nicer, while waiting...
          ccLib.fireCallback(self.settings.onPrepared, self, dataset);
          self.queryEntries(self.settings.pageStart, self.settings.pageSize); // and make the query for actual data
        }
      });
    },
    
    /* This is a needed shortcut that jToxQuery routine will call
    */
    query: function (uri) {
      this.queryDataset(uri);
    }    
  }; // end of prototype
  
  // some public, static methods
  cls.processEntry = function (entry, features, fnValue) {
    for (var fid in features) {
      var feature = features[fid];
      var newVal = entry.values[fid];
      
      // if applicable - location the feature value to a specific location whithin the entry
      if (!!feature.accumulate && newVal !== undefined && feature.location !== undefined) {
        var accArr = feature.location;
        if (!jT.$.isArray(accArr))
          accArr = [accArr];
        
        for (var v = 0; v < accArr.length; ++v)
          ccLib.setJsonValue(entry, accArr[v], ccLib.fireCallback(fnValue, this, fid,  /* oldVal */ ccLib.getJsonValue(entry, accArr[v]), newVal, features));
      }
      
      if (feature.process !== undefined)
        ccLib.fireCallback(feature.process, this, entry, fid, features);
    }
    
    return entry;
  };
  
  cls.findSameAs = function (fid, features) {
    // starting from the feature itself move to 'sameAs'-referred features, until sameAs is missing or points to itself
    // This, final feature should be considered "main" and title and others taken from it.
    var feature = features[fid];
    var base = fid.replace(/(http.+\/feature\/).*/g, "$1");
    var retId = fid;
    
    for (;;){
      if (feature.sameAs === undefined || feature.sameAs == null || feature.sameAs == fid || fid == base + feature.sameAs)
        break;
      if (features[feature.sameAs] !== undefined)
        retId = feature.sameAs;
      else {
        if (features[base + feature.sameAs] !== undefined)
          retId = base + feature.sameAs;
        else
          break;
      }
      
      feature = features[retId];
    }
    
    return retId;
  };
  
  cls.processFeatures = function(features, bases) {
    if (bases == null)
      bases = baseFeatures;
    features = jT.$.extend(features, bases);
    for (var fid in features) {
      
      var sameAs = cls.findSameAs(fid, features);
      // now merge with this one... it copies everything that we've added, if we've reached to it. Including 'location'
      features[fid] = jT.$.extend(features[fid], features[sameAs], { originalId: fid, originalTitle: features[fid].title });
    }
    
    return features;
  };
  
  cls.processDataset = function(dataset, features, fnValue, startIdx) {
    if (ccLib.isNull(features)) {
      cls.processFeatures(dataset.feature);
      features = dataset.feature;
    }

    if (ccLib.isNull(fnValue))
      fnValue = cls.defaultSettings.fnAccumuate;
    
    if (!startIdx)
      startIdx = 0;
      
    for (var i = 0, dl = dataset.dataEntry.length; i < dl; ++i) {
      cls.processEntry(dataset.dataEntry[i], features, fnValue);
      dataset.dataEntry[i].number = i + 1 + startIdx;
      dataset.dataEntry[i].index = i;
    }
    
    return dataset;
  };
  
  return cls;
})();
