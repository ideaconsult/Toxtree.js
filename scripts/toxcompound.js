/* toxcompound.js - General, universal compound dataset visualizer.
 *
 * Copyright 2012-2013, IDEAconsult Ltd. http://www.ideaconsult.net/
 * Created by Ivan Georgiev
**/

var jToxCompound = (function () {
  var defaultSettings = { // all settings, specific for the kit, with their defaults. These got merged with general (jToxKit) ones.
    "noInterface": false,     // runs in interface-less mode, so that it can be used only for information retrieval.
    "showTabs": true,         // should we show tabs with groups, or not
    "tabsFolded": false,      // should present the feature-selection tabs folded initially
    "showExport": true,       // should we add export tab up there
    "showControls": true,     // should we show the pagination/navigation controls.
    "showUnits": true,        // should we show units in the column title.
    "hideEmpty": false,       // whether to hide empty groups instead of making them inactive
    "groupSelection": true,   // wether to show select all / unselect all links in each group
    "hasDetails": true,       // whether browser should provide the option for per-item detailed info rows.
    "hideEmptyDetails": true, // hide feature values, when they are empty (only in detailed view)
    "detailsHeight": "fill",  // what is the tabs' heightStyle used for details row
    "pageSize": 20,           // what is the default (startint) page size.
    "pageStart": 0,           // what is the default startint point for entries retrieval
    "rememberChecks": false,  // whether to remember feature-checkbox settings between queries
    "metricFeature": "http://www.opentox.org/api/1.1#Similarity",   // This is the default metric feature, if no other is specified
    "onTab": null,            // invoked after each group's tab is created - function (element, tab, name, isMain);
    "onLoaded": null,         // invoked when a set of compound is loaded.
    "onPrepared": null,       // invoked when the initial call for determining the tabs/columns is ready
    "onDetails": null,        // invoked when a details pane is openned
    "preDetails": null,       // invoked prior of details pane creation to see if it is going to happen at all
    "oLanguage": {},          // some default language settings, which apply to first (static) table only
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
          "#DetailedInfoRow",
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

          for (var f in miniset.feature) {
            var feat = miniset.feature[f];
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
          for (var f in miniset.feature) {
            if (!miniset.feature[f].used && !miniset.feature[f].basic)
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
      	// and one for unified way of processing diagram. This can be used as template too
      	"http://www.opentox.org/api/1.1#Diagram": {
      	  title: "Diagram", 
      	  search: false,
        	visibility: "main",
        	primary: true,
      	  process: function(entry, fId, features) {
            entry.compound.diagramUri = entry.compound.URI.replace(/(.+)(\/conformer.*)/, "$1") + "?media=image/png";
      	  },
      	  data: "compound.diagramUri",
      	  column: { sClass: "paddingless", sWidth: "125px"},
      	  render: function(data, type, full) {
            return (type != "display") ? "-" : '<div class="jtox-diagram borderless"><span class="ui-icon ui-icon-zoomin"></span><a target="_blank" href="' + full.compound.URI + '"><img src="' + data + '" class="jtox-smalldiagram"/></a></div>';
          }
      	},
      	'#IdRow': {
      	  used: true,
      	  basic: true,
      	  data: "number",
      	  column: { "sClass": "middle"}
      	},
      	"#DetailedInfoRow": {
      	  title: "Diagram", 
      	  search: false,
      	  data: "compound.URI",
      	  basic: true,
      	  primary: true,
      	  column: { sClass: "jtox-hidden jtox-ds-details paddingless", sWidth: "0px"},
        	visibility: "none",
        	render: function(data, type, full) { return ''; }
      	},
      	
      	"http://www.opentox.org/api/1.1#Similarity": {title: "Similarity", data: "compound.metric", search: true},
      },
      "columns": {
        "compound": {
          "Name": { sTitle: "Name", mData: 'title', mRender: function (data, type, full) { return '<span>' + data + '</span><sup class="helper"><a target="_blank" href="' + full.URI + '">?</a></sup>'; } },
          "Value": { sTitle: "Value", mData: 'value', sDefaultContent: "-" },
          "SameAs": { sTitle: "SameAs", mData: 'sameAs', sDefaultContent: "-" },
          "Source": { sTitle: "Source", mData: 'source', sDefaultContent: "-", mRender: function (data, type, full) { return !data || !data.type ? '-' : '<a target="_blank" href="' + data.URI + '">' + data.type + '</a>'; } }
        }
      }
    }
  };

  /* define the standard features-synonymes, working with 'sameAs' property. Beside the title we define the 'data' property
  as well which is used in processEntry() to location value(s) from given (synonym) properties into specific property of the compound entry itself.
  'data' can be an array, which results in adding value to several places.
  */
  var baseFeatures = {
    "http://www.opentox.org/api/1.1#REACHRegistrationDate" : { title: "REACH Date", data: "compound.reachdate", accumulate: true, basic: true },
    "http://www.opentox.org/api/1.1#CASRN" : { title: "CAS", data: "compound.cas", accumulate: true, basic: true, primary: true },
  	"http://www.opentox.org/api/1.1#ChemicalName" : { title: "Name", data: "compound.name", accumulate: true, basic: true },
  	"http://www.opentox.org/api/1.1#TradeName" : {title: "Trade Name", data: "compound.tradename", accumulate: true, basic: true},
  	"http://www.opentox.org/api/1.1#IUPACName": {title: "IUPAC Name", data: ["compound.name", "compound.iupac"], accumulate: true, basic: true },
  	"http://www.opentox.org/api/1.1#EINECS": {title: "EINECS", data: "compound.einecs", accumulate: true, basic: true, primary: true },
    "http://www.opentox.org/api/1.1#InChI": {title: "InChI", data: "compound.inchi", shorten: true, accumulate: true, basic: true},
  	"http://www.opentox.org/api/1.1#InChI_std": {title: "InChI", data: "compound.inchi", shorten: true, accumulate: true, sameAs: "http://www.opentox.org/api/1.1#InChI", basic: true},
    "http://www.opentox.org/api/1.1#InChIKey": {title: "InChI Key", data: "compound.inchikey", accumulate: true, basic: true},
  	"http://www.opentox.org/api/1.1#InChIKey_std": {title: "InChI Key", data: "compound.inchikey", accumulate: true, sameAs: "http://www.opentox.org/api/1.1#InChIKey", basic: true},
    "http://www.opentox.org/api/1.1#InChI_AuxInfo": {title: "InChI Aux", data: "compound.inchiaux", accumulate: true, basic: true},
  	"http://www.opentox.org/api/1.1#InChI_AuxInfo_std": {title: "InChI Aux", data: "compound.inchiaux", accumulate: true, sameAs: "http://www.opentox.org/api/1.1#InChI_AuxInfo", basic: true},
  	"http://www.opentox.org/api/1.1#IUCLID5_UUID": {title: "IUCLID5 UUID", data: "compound.i5uuid", shorten: true, accumulate: true, basic: true, primary: true },
  	"http://www.opentox.org/api/1.1#SMILES": {title: "SMILES", data: "compound.smiles", shorten: true, accumulate: true, basic: true},
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
    
    // make a dull copy here, because, otherwise groups are merged... which we DON'T want
    if (settings != null && settings.configuration != null && settings.configuration.groups != null)
      self.settings.configuration.groups = settings.configuration.groups;
      
    self.instanceNo = instanceCount++;
    if (self.settings.rememberChecks && self.settings.showTabs)
      self.featureStates = {};

    // finally make the query, if Uri is provided      
    if (self.settings['datasetUri'] != null){
      self.queryDataset(self.settings['datasetUri']);
    }
  };
  
  // now follow the prototypes of the instance functions.
  cls.prototype = {
    init: function () {
      var self = this;
      
      self.feature = null; // features, as downloaded from server, after being processed.
      self.dataset = null; // the last-downloaded dataset.
      self.groups = null; // computed groups, i.e. 'groupName' -> array of feature list, prepared.
      self.fixTable = self.varTable = null; // the two tables - to be initialized in prepareTables.
      self.entriesCount = null;
      self.suspendEqualization = false;
      self.orderList = [];
      self.usedFeatures = [];
      self.pageStart = self.settings.pageStart;
      self.pageSize = self.settings.pageSize;
      
      if (!self.settings.noInterface) {
        self.rootElement.appendChild(jT.getTemplate('#jtox-compound'));
        
        jT.ui.bindControls(self, { 
          nextPage: function () { self.nextPage(); },
          prevPage: function () { self.prevPage(); },
          sizeChange: function() { self.queryEntries(self.pageStart, parseInt(jT.$(this).val())); },
          filter: function () { self.updateTables() }
        });
      }
    },
    
    clearDataset: function () {
      if (this.usedFeatures !== undefined) {
        if (!this.settings.noInterface)     
          jT.$(this.rootElement).empty();
        for (var i = 0, fl = this.usedFeatures.length; i < fl; ++i) {
          var fid = this.usedFeatures[i];
          this.feature[fid].used = false;
        }
      }
    },
    
    /* make a tab-based widget with features and grouped on tabs. It relies on filled and processed 'self.feature' as well
    as created 'self.groups'.
    */
    prepareTabs: function (root, isMain, groupFn) {
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
        var grId = "jtox-ds-" + gr.replace(/\s/g, "_") + "-" + self.instanceNo + (isMain ? '' : '-details');
        var grName = gr.replace(/_/g, " ");
        var tabLi = createATab(grId, grName);
        if (isMain)
          tabLi.title = "Select which columns to be displayed";
        
        // now prepare the content...
        var divEl = document.createElement('div');
        divEl.id = grId;
        all.appendChild(divEl);
        // add the group check multi-change
        if (self.settings.groupSelection && isMain) {
          var sel = jT.getTemplate("#jtox-ds-selection");
          divEl.appendChild(sel);
          jT.$('.multi-select', sel).on('click', function (e) {
            var par = jT.$(this).closest('.ui-tabs-panel')[0];
            var doSel = jT.$(this).hasClass('select');
            $('input', par).each(function () {
              this.checked = doSel;
              jT.$(this).trigger('change');
            });
          });
        }
        
        if (groupFn(divEl, gr)) {
          if (self.settings.hideEmpty) {
            jT.$(divEl).remove();
            jT.$(tabLi).remove();
            --idx;
          }
          else
            emptyList.push(idx);
        }
        ++idx;
        
        ccLib.fireCallback(self.settings.onTab, self, divEl, tabLi, grName, isMain);
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
        
        ccLib.fireCallback(self.settings.onTab, self, divEl, liEl, "Export", isMain);
      }
      
      // now show the whole stuff and mark the disabled tabs
      all.style.display = "block";
      return jT.$(all).tabs({ 
        collapsible: isMain, 
        active: (self.settings.tabsFolded && isMain) ? false : 0, 
        disabled: emptyList, 
        heightStyle: isMain ? "content" : (self.settings.detailsHeight == 'auto' ? 'auto' : 'fill') 
      });
    },
    
    equalizeTables: function () {
      var self = this;
      if (!self.suspendEqualization && self.fixTable != null && self.varTable != null) {
        ccLib.equalizeHeights(self.fixTable.tHead, self.varTable.tHead);
        ccLib.equalizeHeights(self.fixTable.tBodies[0], self.varTable.tBodies[0]);

        // now we need to equalize openned details boxes, if any.
        var tabRoot = jT.$('.jtox-ds-tables', self.rootElement)[0];
        var varWidth = jT.$('.jtox-ds-variable', tabRoot).width();

        jT.$('.jtox-details-box', self.rootElement).each(function (i) {
          var cell = jT.$(this).data('rootCell');
          if (!!cell) {
            this.style.display = 'none';
            var ps = ccLib.positionTo(cell, tabRoot);
            this.style.top = ps.top + 'px';
            this.style.left = ps.left + 'px';
            var cellW = jT.$(cell).parents('.dataTables_wrapper').width() - cell.offsetLeft;
            this.style.width = (cellW + varWidth) + 'px';
            this.style.display = 'block';

            var rowH = jT.$(cell).parents('tr').height();
            var cellH = cell.offsetHeight;
            var meH = jT.$(this).height();
            
            if (cellH < rowH)
              jT.$(cell).height(cellH = rowH);
            if (cellH < meH)
              jT.$(cell).height(cellH = meH);
              
            if (meH < cellH) {
              jT.$(this).height(cellH);
              jT.$('.ui-tabs').tabs('refresh');
            }
          }
        });
      }
    },
    
    featureValue: function (fId, data, type) {
      var self = this;
      var feature = self.feature[fId];
      var val = (feature.data !== undefined) ? (ccLib.getJsonValue(data, jT.$.isArray(feature.data) ? feature.data[0] : feature.data)) : data.values[fId];
      return (typeof feature.render == 'function') ? 
        feature.render(val, !!type ? type : 'filter', data) : 
        jT.ui.valueWithUnits(val, !!feature.units && (type == 'display' || type == 'details') ? feature.units : null)
    },
    
    featureUri: function (fId) {
      return this.feature[fId].URI || fId;
    },
    
    featureData: function (entry, set, scope) {
      if (scope == null)
        scope = 'details';
      var self = this;
      var data = [];
      ccLib.enumObject(set, function (fId, idx, level) {
        var feat = jT.$.extend({}, self.feature[fId]);
        var vis = feat.visibility;
        if (!!vis && vis != scope)
          return;
        var title = feat.title;
        feat.value = self.featureValue(fId, entry, scope);
        if (!!title && (!self.settings.hideEmptyDetails || !!feat.value)) {
          data.push(feat)
          if (!feat.value)
            feat.value = '-';
        }
      });
      
      return data;
    },
    
    prepareColumn: function (fId, feature) {
      var self = this;
      if (feature.visibility == 'details')
        return null;
        
      // now we now we should show this one.
      var col = {
        "sTitle": !feature.title ? '' : jT.ui.valueWithUnits(feature.title.replace(/_/g, ' '), (!self.settings.showUnits ? null : feature.units)),
        "sDefaultContent": "-",
      };
      
      if (typeof feature.column == 'function')
        col = feature.column.call(self, col, fId);
      else if (!ccLib.isNull(feature.column))
        col = jT.$.extend(col, feature.column);
      
      if (feature.data !== undefined)
        col["mData"] = feature.data;
      else {
        col["mData"] = 'values';
        col["mRender"] = (function(featureId) { return function(data, type, full) { var val = data[featureId]; return ccLib.isEmpty(val) ? '-' : val }; })(fId);
      }
      
      // other convenient cases
      if (!!feature.shorten) {
        col["mRender"] = function(data, type, full) { return (type != "display") ? '' + data : jT.ui.shortenedData(data, "Press to copy the value in the clipboard"); };
        col["sWidth"] = "75px";
      }
  
      // finally - this one.          
      if (feature.render !== undefined)
        col["mRender"] = feature.render;
      if (feature.order != null)
        col["iOrder"] = feature.order;
      return col;
    },
    
    prepareTables: function() {
      var self = this;
      var varCols = [];
      var fixCols = [];
      
      // first, some preparation of the first, IdRow column
      var idFeature = self.settings.configuration.baseFeatures['#IdRow'];
      if (!idFeature.render) {
        idFeature.render = self.settings.hasDetails ? 
          function (data, type, full) {
            return (type != "display") ?
              '' + data : 
              "&nbsp;-&nbsp;" + data + "&nbsp;-&nbsp;<br/>" + 
              '<span class="jtox-details-open ui-icon ui-icon-folder-collapsed" title="Press to open/close detailed info for this compound"></span>';
          } : // no details case
          function (data, type, full) { 
            return (type != "display") ?
              '' + data : 
              "&nbsp;-&nbsp;" + data + "&nbsp;-&nbsp;";
          };
      }
      
      fixCols.push(
        self.prepareColumn('#IdRow', idFeature),
        { "sClass": "jtox-hidden", "mData": "index", "sDefaultContent": "-", "bSortable": true, "mRender": function(data, type, full) { return ccLib.isNull(self.orderList) ? 0 : self.orderList[data]; } } // column used for ordering
      );
      
      varCols.push({ "sClass": "jtox-hidden jtox-ds-details paddingless", "mData": "index", "mRender": function(data, type, full) { return ''; }  });

      // prepare the function for column switching...      
      var fnShowColumn = function() {
        var dt = $(this).data();
        var cells = jT.$(dt.sel + ' table tr>*:nth-child(' + (dt.idx + 1) + ')', self.rootElement);
        if (this.checked) {
          jT.$(cells).show();
          jT.$("table tr .blank-col", self.rootElement).addClass('jtox-hidden');
        }
        else {
          jT.$(cells).hide();
          if (jT.$(dt.sel + " table tr *:visible", self.rootElement).length == 0)
            jT.$("table tr .blank-col", self.rootElement).removeClass('jtox-hidden');
        }
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
      
      var fnShowDetails = (self.settings.hasDetails ? function(row, event) {
        var cell = jT.$(".jtox-ds-details", row)[0];
        var idx = jT.$(row).data('jtox-index');
        
        if (self.settings.preDetails != null && !ccLib.fireCallback(self.settings.preDetails, self, idx, cell) || !cell)
          return; // the !cell  means you've forgotten to add #DetailedInfoRow feature somewhere.
        jT.$(row).toggleClass('jtox-detailed-row');
        var toShow = jT.$(row).hasClass('jtox-detailed-row');

        // now go and expand both fixed and variable table details' cells.
        fnExpandCell(cell, toShow);
        var varCell = document.getElementById('jtox-var-' + self.instanceNo + '-' + idx).firstElementChild;
        fnExpandCell(varCell, toShow);
        
        jT.$('.jtox-details-open', row).toggleClass('ui-icon-folder-open ui-icon-folder-collapsed');
        
        if (toShow) {
          // i.e. we need to show it - put the full sized diagram in the fixed part and the tabs in the variable one...
          var entry = self.dataset.dataEntry[idx];

          var detDiv = document.createElement('div');
          detDiv.className = 'jtox-details-box jtox-details';

          var tabRoot = jT.$('.jtox-ds-tables', self.rootElement)[0];
          var width = jT.$(cell).width() + jT.$('.jtox-ds-variable', tabRoot).width();
          jT.$(detDiv).width(width);

          if (ccLib.isNull(self.settings.detailsHeight) || self.settings.detailsHeight == 'fill')
            jT.$(detDiv).height(jT.$(cell).height() * 2);
          else if (parseInt(self.settings.detailsHeight) > 0)
            jT.$(detDiv).height(self.settings.detailsHeight)

          tabRoot.appendChild(detDiv);
          
          self.prepareTabs(detDiv, false, function (parent, gr) {
            var data = self.featureData(entry, self.groups[gr]);
            
            if (data.length > 0 || !self.settings.hideEmpty) {
              jT.$(parent).addClass('jtox-details-table');
              var tabTable = document.createElement('table');
              parent.appendChild(tabTable);
              jT.$(tabTable).dataTable({
                "bPaginate": true,
                "bProcessing": true,
                "bLengthChange": false,
        				"bAutoWidth": true,
                "sDom" : "rt<f>",
                "aoColumns": jT.ui.processColumns(self, 'compound'),
                "bSort": true,
              });
              jT.$(tabTable).dataTable().fnAddData(data);
              jT.$(tabTable).dataTable().fnAdjustColumnSizing();
            }
            
            return data.length == 0;
          });
          
          jT.$(cell).height(detDiv.offsetHeight);
          ccLib.fireCallback(self.settings.onDetails, self, detDiv, entry, cell);
          jT.$(cell).data('detailsDiv', detDiv);
          jT.$(detDiv).data('rootCell', cell);
        }
        else {
          // i.e. we need to hide
          jT.$(cell).data('detailsDiv').remove();
          jT.$(cell).data('detailsDiv', null);
          cell.style.height = '';
        }
        
        self.equalizeTables();
      } : null); // fnShowDetails definition end

      // now proceed to enter all other columns
      for (var gr in self.groups) {
        ccLib.enumObject(self.groups[gr], function (fId, idx, level) {
          if (idx == "name")
            return;
            
          var feature = self.feature[fId];
          var col = self.prepareColumn(fId, feature);
          if (!col)
            return;
          
          // finally - assign column switching to the checkbox of main tab.
          var colList = !!feature.primary ? fixCols : varCols;
          jT.$('.jtox-ds-features input.jtox-checkbox[value="' + fId + '"]', self.rootElement).data({ sel: !!feature.primary ? '.jtox-ds-fixed' : '.jtox-ds-variable', idx: colList.length, id: fId}).on('change', fnShowColumn)
          
          // and push it into the proper list.
          colList.push(col);
        });
      }
      
      // now - sort columns and create the tables...
      jT.ui.sortColDefs(fixCols);
      self.fixTable = (jT.$(".jtox-ds-fixed table", self.rootElement).dataTable({
        "bPaginate": false,
        "bLengthChange": false,
				"bAutoWidth": true,
        "sDom" : "rt",
        "aoColumns": fixCols,
        "bSort": false,
        "fnCreatedRow": function( nRow, aData, iDataIndex ) {
          // attach the click handling
          if (self.settings.hasDetails)
            jT.$('.jtox-details-open', nRow).on('click', function(e) { fnShowDetails(nRow, e); });
          jT.$(nRow).data('jtox-index', iDataIndex);
          ccLib.fireCallback(self.settings.onRow, self, nRow, aData, iDataIndex);
          jT.ui.installHandlers(self, nRow);
          jT.$('.jtox-diagram span.ui-icon', nRow).on('click', function () {
            setTimeout(function () {
              jT.$(self.fixTable).dataTable().fnAdjustColumnSizing();
              self.equalizeTables();
            }, 50);
          });
        },
        "oLanguage" : { "sEmptyTable": '<span class="jt-feeding">' + (self.settings.oLanguage.sProcess || 'Feeding data...') + '</span>' }
      }))[0];

      // we need to put a fake column to stay, when there is no other column here, or when everything is hidden..
      varCols.push({ "sClass": "center blank-col" + (varCols.length > 1 ? " jtox-hidden" : ""), "mData": "index", "mRender": function(data, type, full) { return type != 'display' ? data : '...'; }  });

      jT.ui.sortColDefs(varCols);
      self.varTable = (jT.$(".jtox-ds-variable table", self.rootElement).dataTable({
        "bPaginate": false,
        "bProcessing": true,
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
          ccLib.fireCallback(self.settings.onRow, self, nRow, aData, iDataIndex);
          jT.ui.installHandlers(self, nRow);
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
        "oLanguage" : { "sEmptyTable": "-"}
      }))[0];
    },

    updateTables: function() {
      var self = this;
      if (self.settings.hasDetails) 
        $('div.jtox-details-box', self.rootElement).remove();

      self.filterEntries(jT.$('.jtox-controls input', self.rootElement).val());
    },
    
    /* Prepare the groups and the features.
    */
    prepareGroups: function (miniset) {
      var self = this;
      
      var grps = self.settings.configuration.groups;
      if (typeof grps == 'function')
        grps = grps(miniset, self);
        
      self.groups = {};
      for (var i in grps){
        var grp = grps[i];
        if (ccLib.isNull(grp))
          continue;
          
        var grpArr = (typeof grp == "function" || typeof grp == "string") ? ccLib.fireCallback(grp, self, i, miniset) : grp;
        self.groups[i] = [];
        ccLib.enumObject(grpArr, function(fid, idx) {
          var isUsed = false;
          cls.enumSameAs(fid, self.feature, function (feature) {
            isUsed |= feature.used;
          });
          if (idx != "name" && !isUsed) {
            self.groups[i].push(fid);
            // these we need to be able to return back to original state.
            self.usedFeatures.push(fid);
            self.feature[fid].used = true;
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
            var feat = self.feature[fId];
            if (feat.search !== undefined && !feat.search)
              return false;
            var val = self.featureValue(fId, entry, 'sort');
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
      jT.$('.jt-feeding', self.rootElement).html(self.settings.oLanguage.sZeroRecords || 'No records matching the filter.');

      ccLib.fillTree(jT.$('.jtox-controls', self.rootElement)[0], {
        "filtered-text": !needle ? " " : ' (filtered to <span class="high">' + dataFeed.length + '</span>) '
      });
      
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
      if (self.entriesCount == null || self.pageStart + self.pageSize < self.entriesCount)
        self.queryEntries(self.pageStart + self.pageSize);
    },
    
    prevPage: function() {
      var self = this;
      if (self.pageStart > 0)
        self.queryEntries(self.pageStart - self.pageSize);
    },
    
    updateControls: function (qStart, qSize) {
      var self = this;
      var pane = jT.$('.jtox-controls', self.rootElement)[0];
      ccLib.fillTree(pane, {
        "pagestart": qSize > 0 ? qStart + 1 : 0,
        "pageend": qStart + qSize
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
    },
    
    queryUri: function (scope) {
      var self = this;
      if (self.datasetUri == null)
        return null;
      if (scope == null)
        scope = { from: self.pageStart, size: self.pageSize };
      if (scope.from < 0)
        scope.from = 0;
      if (scope.size == null)
        scope.size = self.pageSize;
        
      return ccLib.addParameter(self.datasetUri, "page=" + Math.floor(scope.from / scope.size) + "&pagesize=" + scope.size);
    },
    
    // make the actual query for the (next) portion of data.
    queryEntries: function(from, size, dataset) {
      var self = this;
      var scope = { 'from': from, 'size': size };
      var qUri = self.queryUri(scope);
      jT.$('.jtox-controls select', self.rootElement).val(scope.size);
      self.dataset = null;

      // the function for filling
      var fillFn = function(dataset) {
        if (!!dataset){
          // first, arrange the page markers
          self.pageSize = scope.size;
          var qStart = self.pageStart = Math.floor(scope.from / scope.size) * scope.size;
          if (dataset.dataEntry.length < self.pageSize) // we've reached the end!!
            self.entriesCount = qStart + dataset.dataEntry.length;
          
          // then process the dataset
          self.dataset = cls.processDataset(dataset, self.feature, self.settings.fnAccumulate, self.pageStart);
          if (!self.settings.noInterface) {
            // ok - go and update the table, filtering the entries, if needed            
            self.updateTables();
            if (self.settings.showControls)
              // finally - go and update controls if they are visible
              self.updateControls(qStart, dataset.dataEntry.length);
          }
        }
        // time to call the supplied function, if any.
        ccLib.fireCallback(self.settings.onLoaded, self, dataset);
      };
  
      // we may be passed dataset, if the initial, setup query was 404: Not Found - to avoid second such query...
      if (dataset != null)
        fillFn(dataset)
      else 
        jT.call(self, qUri, fillFn);
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
      self.datasetUri = (datasetUri.indexOf('http') !=0 ? self.settings.baseUrl : '') + datasetUri;
      
      var procDiv = jT.$('.jt-processing', self.rootElement).show()[0];
      if (!!self.settings.oLanguage.sLoadingRecords)
        jT.$('.message', procDiv).html(self.settings.oLanguage.sLoadingRecords);

      jT.call(self, ccLib.addParameter(self.datasetUri, "page=0&pagesize=1"), function (dataset, jhr) {
        var empty = false;
        if (!dataset && jhr.status == 404) {
          empty = true;
          dataset = { feature: {}, dataEntry: [] }; // an empty set, to make it show the table...
        }
        
        // remove the loading pane in anyways..
        jT.$(procDiv).hide();
        if (!!dataset) {
          self.feature = dataset.feature;
          cls.processFeatures(self.feature, self.settings.configuration.baseFeatures);
          if (!self.settings.noInterface) {
            self.prepareGroups(dataset);
            if (self.settings.showTabs) {
              // tabs feature building
              var nodeFn = function (id, name, parent) {
                var fEl = jT.getTemplate('#jtox-ds-feature');
                parent.appendChild(fEl);
                ccLib.fillTree(fEl, {title: name.replace(/_/g, ' '), uri: self.featureUri(id)});
          
                var checkEl = jT.$('input[type="checkbox"]', fEl)[0];
                if (!checkEl)
                  return;
                checkEl.value = id;
                if (self.settings.rememberChecks)
                  checkEl.checked = (self.featureStates[id] === undefined || self.featureStates[id]);
          
                return fEl;
              };
  
              self.prepareTabs(jT.$('.jtox-ds-features', self.rootElement)[0], true, function (divEl, gr) {
                var empty = true;
                ccLib.enumObject(self.groups[gr], function (fId, idx, level) {
                  var vis = (self.feature[fId] || {})['visibility'];
                  if (!!vis && vis != 'main')
                    return;
                  empty = false;
                  if (idx == "name")
                    var fEl = nodeFn(null, fId, divEl);
                  else if (level == 1) {
                    var title = self.feature[fId].title;
                    if (!ccLib.isNull(title))
                      nodeFn(fId, title, divEl);
                  }
                });
                
                return empty;
              });
            }
            
            self.prepareTables(); // prepare the tables - we need features to build them - we have them!
            self.equalizeTables(); // to make them nicer, while waiting...
            ccLib.fireCallback(self.settings.onPrepared, self, dataset, self);
          }
          
          self.queryEntries(self.pageStart, self.pageSize, empty ? dataset : null); // and make the query for actual data
        }
      });
    },
    
    /* This is a needed shortcut that jToxQuery routine will call
    */
    query: function (uri) {
      this.queryDataset(uri);
    }    
  }; // end of prototype
  
  // merge them for future use..
  cls.baseFeatures = jT.$.extend({}, baseFeatures, defaultSettings.configuration.baseFeatures);
  
  // some public, static methods
  cls.processEntry = function (entry, features, fnValue) {
    for (var fid in features) {
      var feature = features[fid];
      var newVal = entry.values[fid];
      
      // if applicable - location the feature value to a specific location whithin the entry
      if (!!feature.accumulate && newVal !== undefined && feature.data !== undefined) {
        var fn = typeof feature.accumulate == 'function' ? feature.accumulate : fnValue;
        var accArr = feature.data;
        if (!jT.$.isArray(accArr))
          accArr = [accArr];
        
        for (var v = 0; v < accArr.length; ++v)
          ccLib.setJsonValue(entry, accArr[v], ccLib.fireCallback(fn, this, fid,  /* oldVal */ ccLib.getJsonValue(entry, accArr[v]), newVal, features));
      }
      
      if (feature.process !== undefined)
        ccLib.fireCallback(feature.process, this, entry, fid, features);
    }
    
    return entry;
  };
  
  cls.extractFeatures = function (entry, features, callback) {
    var data = [];
    for (var fId in features) {
      var feat = jT.$.extend({}, features[fId]);
      feat.value = entry.values[fId];
      if (!!feat.title) {
        if (ccLib.fireCallback(callback, null, feat, fId)) {
          if (!feat.value)
            feat.value = '-';
          data.push(feat);
        }
      }
    };
    
    return data;
  };
  
  cls.enumSameAs = function (fid, features, callback) {
    // starting from the feature itself move to 'sameAs'-referred features, until sameAs is missing or points to itself
    // This, final feature should be considered "main" and title and others taken from it.
    var feature = features[fid];
    var base = fid.replace(/(http.+\/feature\/).*/g, "$1");
    var retId = fid;
    
    for (;;){
      ccLib.fireCallback(callback, null, feature, retId);
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
      var theFeat = features[fid];
      if (!theFeat.URI)
        theFeat.URI = fid;
      cls.enumSameAs(fid, features, function (feature, id) {
        var sameAs = feature.sameAs;
        feature = jT.$.extend(true, feature, theFeat);
        theFeat = jT.$.extend(true, theFeat, feature);
        feature.sameAs = sameAs;
      });
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
