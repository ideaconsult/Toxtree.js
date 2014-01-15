/* toxdataset.js - General, universal dataset visualizer.
 *
 * Copyright 2012-2013, IDEAconsult Ltd. http://www.ideaconsult.net/
 * Created by Ivan Georgiev
**/

var jToxDataset = (function () {
  var defaultSettings = { // all settings, specific for the kit, with their defaults. These got merged with general (jToxKit) ones.
    "showExport": true,
    "groups": {
      "Identifiers" : function(name, features) { return [
        "http://www.opentox.org/api/1.1#Diagram", 
        "http://www.opentox.org/api/1.1#CASRN", 
        "http://www.opentox.org/api/1.1#EINECS",
        "http://www.opentox.org/api/1.1#IUCLID5_UUID"
      ];},
      
      "Names": function (name, features) { return [
        "http://www.opentox.org/api/1.1#ChemicalName",
        "http://www.opentox.org/api/1.1#TradeName",
        "http://www.opentox.org/api/1.1#IUPACName",
        "http://www.opentox.org/api/1.1#SMILES",
        "http://www.opentox.org/api/1.1#InChIKey",
        "http://www.opentox.org/api/1.1#InChI",
        "http://www.opentox.org/api/1.1#REACHRegistrationDate"
      ];},
      
      "Calculated": function (name, features) {
        var arr = [];
        for (var f in features) {
          if (!ccLib.isNull(features[f].source) && !ccLib.isNull(features[f].source.type) && !features[f].source.type.toLowerCase() == "algorithm")
            arr.push(f);
        }
        return arr;
      },
      
      "Other": function (name, features) {
        var arr = [];
        for (var f in features) {
          if (!features[f].used)
            arr.push(f);
        }
        return arr;
      }
    },
    "exports": [
      {type: "chemical/x-mdl-sdfile", icon: "images/sdf.jpg"},
      {type: "chemical/x-cml", icon: "images/cml.jpg"},
      {type: "chemical/x-daylight-smiles", icon: "images/smi.png"},
      {type: "chemical/x-inchi", icon: "images/inchi.png"},
      {type: "text/uri-list", icon: "images/link.png"},
      {type: "application/pdf", icon: "images/pdf.png"},
      {type: "text/csv", icon: "images/excel.png"},
      {type: "text/plain", icon: "images/excel.png"},
      {type: "text/x-arff", icon: "images/weka.png"},
      {type: "text/x-arff-3col", icon: "images/weka.png"},
      {type: "application/rdf+xml", icon: "images/rdf.gif"},
      {type: "application/json", icon: "images/json.png"}
    ]
  };
  var instanceCount = 0;

  /* define the standard features-synonymes, working with 'sameAs' property. Beside the title we define the 'accumulate' property
  as well which is used in processEntry() to accumulate value(s) from given (synonym) properties into specific property of the compound entry itself.
  'accumulate' can be an array, which results in adding value to several places.
  */
  var baseFeatures = {
    "http://www.opentox.org/api/1.1#REACHRegistrationDate" : { title: "REACH Date", accumulate: "compound.reachdate", used: true},
    "http://www.opentox.org/api/1.1#CASRN" : { title: "CAS", accumulate: "compound.cas", used: true},
  	"http://www.opentox.org/api/1.1#ChemicalName" : { title: "Name", accumulate: "compound.name", used: true},
  	"http://www.opentox.org/api/1.1#TradeName" : {title: "Trade Name", accumulate: "compound.tradename", used: true},
  	"http://www.opentox.org/api/1.1#IUPACName": {title: "IUPAC Name", accumulate: ["compound.name", "compound.iupac"], used: true},
  	"http://www.opentox.org/api/1.1#EINECS": {title: "EINECS", accumulate: "compound.einecs", used: true},
    "http://www.opentox.org/api/1.1#InChI": {title: "InChI", accumulate: "compound.inchi", used: true, shorten: true},
  	"http://www.opentox.org/api/1.1#InChI_std": {title: "InChI", accumulate: "compound.inchi", used: true, shorten: true},
    "http://www.opentox.org/api/1.1#InChIKey": {title: "InChI Key", accumulate: "compound.inchikey", used: true},
  	"http://www.opentox.org/api/1.1#InChIKey_std": {title: "InChI Key", accumulate: "compound.inchikey", used: true},
    "http://www.opentox.org/api/1.1#InChI_AuxInfo": {title: "InChI Aux", accumulate: "compound.inchi", used: true},
  	"http://www.opentox.org/api/1.1#InChI_AuxInfo_std": {title: "InChI Aux", accumulate: "compound.inchi", used: true},
  	"http://www.opentox.org/api/1.1#IUCLID5_UUID": {title: "IUCLID5 UUID", accumulate: "compound.i5uuid", used: true, shorten: true},
  	"http://www.opentox.org/api/1.1#SMILES": {title: "SMILES", accumulate: "compound.smiles", used: true, shorten: true},
  	"http://www.opentox.org/api/dblinks#CMS": {title: "CMS", used: true},
  	"http://www.opentox.org/api/dblinks#ChEBI": {title: "ChEBI", used: true},
  	"http://www.opentox.org/api/dblinks#Pubchem": {title: "Public Chem", used: true},
  	"http://www.opentox.org/api/dblinks#ChemSpider": {title: "Chem Spider", used: true},
  	"http://www.opentox.org/api/dblinks#ChEMBL": {title: "ChEMBL", used: true},
  	"http://www.opentox.org/api/dblinks#ToxbankWiki": {title: "Toxban Wiki", used: true},
  	// and one for unified way of processing diagram
  	"http://www.opentox.org/api/1.1#Diagram": {title: "Diagram", accumulate: "compound.URI", used: true},
  };

  // constructor
  var cls = function (root, settings) {
    var self = this;
    self.rootElement = root;
    self.settings = $.extend({}, defaultSettings, jToxKit.settings, settings); // i.e. defaults from jToxDataset
    self.features = null; // features, as downloaded from server, after being processed.
    self.dataset = null; // the last-downloaded dataset.
    self.groups = null; // computed groups, i.e. 'groupName' -> array of feature list, prepared.
    self.fixTable = self.varTable = null; // the two tables - to be initialized in prepareTables.
    self.instanceNo = instanceCount++;
    
    root.appendChild(jToxKit.getTemplate('#jtox-dataset'));
  };
  
  // now follow the prototypes of the instance functions.
  cls.prototype = {
    /* make a tab-based widget with features and grouped on tabs. It relies on filled and processed 'self.features' as well
    as created 'self.groups'.
    */
    prepareTabs: function (root, isMain, nodeFn, divFn) {
      var self = this;
      
      var fr = document.createDocumentFragment();
      var all = document.createElement('div');
      fr.appendChild(all);
      ulEl = document.createElement('ul');
      all.appendChild(ulEl);

      var featNames = {};
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
        var grId = "jtox-ds-" + gr + "-" + self.instanceNo;
        createATab(grId, gr.replace(/_/g, " "));
        
        // now prepare the content...
        var divEl = document.createElement('div');
        divEl.id = grId;
        all.appendChild(divEl);
        
        // .. check if we have something else to add in between
        if (typeof divFn == 'function') {
          divEl = divFn(gr, divEl); // it's expected to attach it
        }
        // ... and fill it.
        for (var i = 0, glen = self.groups[gr].length;i < glen; ++i) {
          var fId = self.groups[gr][i];
          if (!ccLib.isNull(self.features[fId].title)) {
            var el = nodeFn(fId, self.features[fId].title);
            if (!ccLib.isNull(el))
              divEl.appendChild(el);
            self.features[fId].used = true;
          }
        }
        
        if (glen == 0)
          emptyList.push(idx);
        ++idx;
      }
      
      if (isMain && self.settings.showExport) {
        var tabId = "jtox-ds-export-" + self.instanceNo;
        var liEl = createATab(tabId, "Export");
        $(liEl).addClass('jtox-ds-export');
        var divEl = jToxKit.getTemplate('#jtox-ds-export')
        divEl.id = tabId;
        all.appendChild(divEl);
        divEl = divEl.getElementsByClassName('jtox-exportlist')[0];
        
        var base = jToxKit.grabBaseUrl(self.datasetUri, "dataset");
        for (var i = 0, elen = self.settings.exports.length; i < elen; ++i) {
          var expo = self.settings.exports[i];
          var el = jToxKit.getTemplate('#jtox-ds-download');
          divEl.appendChild(el);
          
          el.getElementsByTagName('a')[0].href = ccLib.addParameter(self.datasetUri, "media=" + expo.type);
          var img = el.getElementsByTagName('img')[0];
          img.alt = img.title = expo.type;
          img.src = base + expo.icon;
        }
      }
      
      // now append the prepared document fragment and prepare the tabs.
      root.appendChild(fr);
      return $(all).tabs({ collapsible: isMain, disabled: emptyList});
    },
    
    equalizeTables: function () {
      var self = this;
      if (self.fixTable != null && self.varTable != null) {
        ccLib.equalizeHeights(self.fixTable.tHead, self.varTable.tHead);
        ccLib.equalizeHeights(self.fixTable.tBodies[0], self.varTable.tBodies[0]);
      }
    },
    
    featureValue: function (fId, data) {
      var self = this;
      var feature = self.features[fId];
      if (feature.accumulate !== undefined)
        return ccLib.getJsonValue(data, feature.accumulate)
      else
        return data.values[fId];
    },
    
    prepareTables: function() {
      var self = this;
      var varCols = [];
      var fixCols = [];
      
      var colList = fixCols;
      // enter the first column - the number.
      
      fixCols.push({
            "mData": "index",
            "sClass": "middle",
            "mRender": function (data, type, full) { 
              return (type != "display") ?
                '' + data : 
                "&nbsp;-&nbsp;" + data + "&nbsp;-&nbsp;<br/>" + 
                  '<span class="jtox-details-open ui-icon ui-icon-circle-triangle-s" title="Press to open/close detailed info for the entry"></span>';
            }
        },
        { "sClass": "jtox-hidden jtox-ds-details", "mData": "index", "mRender": function(data, type, full) { return ''; } } // details column
      );
      
      varCols.push({ "sClass": "jtox-hidden jtox-ds-details borderless paddingless", "mData": "index", "mRender": function(data, type, full) { return ''; }  });

      // prepare the function for column switching...      
      var fnShowColumn = function(sel, idx) {
        return function() {
          var cells = $(sel + ' table tr>*:nth-child(' + (idx + 1) + ')', self.rootElement);
          if (this.checked)
            $(cells).show();
          else
            $(cells).hide();
          self.equalizeTables();
        }
      };
      
      var fnExpandCell = function (cell, expand) {
        var cnt = 0;
        for (var c = cell;c; c = c.nextElementSibling, ++cnt)
          $(c).toggleClass('jtox-hidden');

        if (expand)
          cell.setAttribute('colspan', '' + cnt);
        else 
          cell.removeAttribute('colspan');
      };
      
      var fnShowDetails = function(row) {
        var cell = $(".jtox-ds-details", row)[0];
        var idx = $(row).data('jtox-index');
        $(row).toggleClass('jtox-detailed-row');
        var toShow = $(row).hasClass('jtox-detailed-row');

        // now go and expand both fixed and variable table details' cells.
        fnExpandCell(cell, toShow);
        var varCell = document.getElementById('jtox-var-' + self.instanceNo + '-' + idx).firstElementChild;
        fnExpandCell(varCell, toShow);
        
        var iconCell = $('.jtox-details-open', row);
        $(iconCell).toggleClass('ui-icon-circle-triangle-s');
        $(iconCell).toggleClass('ui-icon-circle-triangle-n');

        if (toShow) {
          // i.e. we need to show it - put the full sized diagram in the fixed part and the tabs in the variable one...
          var full = self.dataset.dataEntry[idx];
          
          var detDiv = document.createElement('div');
          varCell.appendChild(detDiv);
          var tabList = self.prepareTabs(detDiv, false, 
            function (id, name) {
              if (cls.shortFeatureId(id) == "Diagram")
                return null;
                
              var fEl = jToxKit.getTemplate('#jtox-one-detail');
              ccLib.fillTree(fEl, {title: name, value: self.featureValue(id, full)});
              return fEl;
            },
            function (id, parent) {
              var tabTable = jToxKit.getTemplate('#jtox-details-table');
              parent.appendChild(tabTable);
              return tabTable;  
            }
          );
          
          var img = new Image();
          img.onload = function(e) { 
            self.equalizeTables();
            $(detDiv).height(varCell.parentNode.clientHeight)
            // $(detDiv).width(self.varTable.parentNode.clientWidth); // enable this if you want the table to be the width of the visible part.
            $(tabList).tabs( "option", "heightStyle", "fill" );
          };
          img.src = full.compound.diagramUri;
          cell.appendChild(img);
        }
        else {
          // i.e. we need to hide
          $(cell).empty();
          $(varCell).empty();
          self.equalizeTables();
        }
      };

      // make a query for all checkboxes in the main tab, so they can be traversed in parallel with the features and 
      // a change handler added.
      var checkList = $('.jtox-ds-features .jtox-checkbox', self.rootElement);
      var checkIdx = 0;
      
      // now proceed to enter all other columns
      for (var gr in self.groups){
        for (var i = 0, glen = self.groups[gr].length; i < glen; ++i) {
          var fId = self.groups[gr][i];
          var feature = self.features[fId];
          var col = {
            "sTitle": feature.title + (ccLib.isNull(feature.units) ? "" : feature.units),
            "sDefaultContent": "-",
            "mData": feature.accumulate !== undefined ? feature.accumulate : "values." + fId
          };
          
          // some special cases, like diagram
          var shortId = cls.shortFeatureId(fId);
          if (shortId == "Diagram") {
            col["mRender"] = function(data, type, full) {
              return (type != "display") ? "-" : '<img src="' + full.compound.diagramUri + '" class="jtox-ds-smalldiagram jtox-details-open"/>';  
            };
            col["sClass"] = "paddingless";
            col["sWidth"] = "125px";
          }
          else if (!!feature.shorten) {
            col["mRender"] = function(data, type, full) {
              return (type != "display") ? '' + data : jToxKit.shortenedData(data, "Press to copy the value in the clipboard");
            };
            col["sWidth"] = "75px";
          }
          
          // finally - assign column switching to the checkbox of main tab.
          $(checkList[checkIdx++]).on('change', fnShowColumn(colList == fixCols ? '.jtox-ds-fixed' : '.jtox-ds-variable', colList.length))
          
          // and push it into the proper list.
          colList.push(col);
        }
        
        // after the first one we switch to variable table's columns.
        colList = varCols;
      }
      
      var fnQueryInfo = function(aoData) {
          var info = {};
          for (var i = 0, dl = aoData.length; i < dl; ++i)
            info[aoData[i].name] = aoData[i].value;
          return info;
      };
      
      // some helpers
      var fnSortDataset = function(info) {
        var data = [];
        for (var i = 0;i < info['iSortingCols']; ++i)
          data.push(info["mDataProp_" + info['iSortCol_' + i]]);
          
        if (data.length > 0){
          self.dataset.dataEntry.sort(function(a, b){
            for (var i = 0, dl = data.length; i < dl; ++i) {
              var val1 = ccLib.getJsonValue(a, data[i]);
              var val2 = ccLib.getJsonValue(b, data[i]);
              if (val1 < val2)
                return -1;
              else if (val1 > val2)
                return 1;
            }
            
            return 0;
          });
        }
      };
      
      var fnSearchDataset = function(needle) {
        
      };
      
      // now - create the tables - they have common options, except the aoColumns (i.e. column definitions), which are added later.
      self.varTable = ($(".jtox-ds-variable table", self.rootElement).dataTable({
        "bPaginate": false,
        "bProcessing": false,
        "bLengthChange": false,
				"bAutoWidth": true,
        "sDom" : "rt",
        "bSort": true,
        "aoColumns": varCols,
        "bScrollCollapse": true,
        "fnCreatedRow": function( nRow, aData, iDataIndex ) {
          nRow.id = 'jtox-var-' + self.instanceNo + '-' + iDataIndex;
        },
        "fnDrawCallback": function(oSettings) { self.equalizeTables(); }
      }))[0];
      
      self.fixTable = ($(".jtox-ds-fixed table", self.rootElement).dataTable({
        "bPaginate": true,
        "bProcessing": true,
        "bLengthChange": false,
				"bAutoWidth": true,
        "sDom" : "rt<Fip>",
        
        "aoColumns": fixCols,
        "bSort": false,
        "fnDrawCallback": function(oSettings) { self.equalizeTables(); },
        "fnCreatedRow": function( nRow, aData, iDataIndex ) {
          // attach the click handling      
          $('.jtox-details-open', nRow).on('click', function(e) {
            fnShowDetails(nRow);
          });
          $(nRow).data('jtox-index', iDataIndex);
        },
        
        "bServerSide": true,
        "fnServerData": function ( sSource, aoData, fnCallback, oSettings ) {
          var info = fnQueryInfo(aoData);
          console.log("Server request with info = " + JSON.stringify(info));

          var page = info.iDisplayStart / info.iDisplayLength;
/*
          theForm.Order = tableCols[info.iSortCol_0].mData;
          theForm.Direction = info.sSortDir_0;
*/
          var qUri = ccLib.addParameter(self.datasetUri, "page=" + page + "&pagesize=" + info.iDisplayLength);
          jToxKit.call(self, qUri, function(dataset){
            if (!!dataset){
              self.dataset = cls.processDataset(dataset, self.features, function(oldVal, newVal) {
                if (ccLib.isNull(oldVal) || newVal.toLowerCase().indexOf(oldVal.toLowerCase()) >= 0)
                  return newVal;
                if (oldVal.toLowerCase().indexOf(newVal.toLowerCase()) >= 0)
                  return oldVal;
                return oldVal + ", " + newVal;
              });
              
              $(self.varTable).dataTable().fnClearTable();
              $(self.varTable).dataTable().fnAddData(dataset.dataEntry);
              
              fnCallback({
                "sEcho": info.sEcho,
                "iTotalRecords": dataset.query.total,
                "iTotalDisplayRecords": dataset.dataEntry.length,
                "aaData": dataset.dataEntry
              });
              
/*
              $(self.varTable).dataTable().fnAdjustColumnSizing();
              $(self.fixTable).dataTable().fnAdjustColumnSizing();
*/
            }
          });
        }
      }))[0];
    },

    /* Process features as reported in the dataset. Works on result of standalone calls to <datasetUri>/feature
    */
    prepareGroups: function () {
      var self = this;
      
      var grps = self.settings.groups;
      self.groups = {};
      for (var i in grps){
        self.groups[i] = (grps[i])(i, self.features);
      }
    },
    
    /* Clears the page from any dataset fillings, so a new call can be made.
    */
    clearDataset: function () {
      var self = this;
    },
    
    /* Makes a query to the server for particular dataset, asking for feature list first, so that the table(s) can be 
    prepared.
    */
    queryDataset: function (datasetUri) {
      var self = this;
      
      self.clearDataset();
      self.datasetUri = datasetUri;
      jToxKit.call(self, datasetUri + '/feature', function (feature) {
        if (!!feature) {
          self.features = feature.feature;
          cls.processFeatures(self.features);
          self.prepareGroups();
          self.prepareTabs($('.jtox-ds-features', self.rootElement)[0], true, function (id, name){
            var fEl = jToxKit.getTemplate('#jtox-ds-feature');
            ccLib.fillTree(fEl, {title: name});
            $(fEl).data('feature-id', id);
            return fEl;
          });
          self.prepareTables(); // prepare and add the tables - they will make certain queries to fill up with data.
        }
      });
    },
    
  }; // end of prototype
  
  // some public, static methods
  cls.shortFeatureId = function(fId) {
    return fId.substr(fId.indexOf('#') + 1); // a small trick - 'not-found' returns -1, and adding 1 results in exactly what we want: 0, i.e. - start, i.e. - no change.
  };
  
  cls.processEntry = function (entry, features, fnValue) {
    for (var fid in entry.values) {
      var feature = features[fid];
      
      // if applicable - accumulate the feature value to a specific location whithin the entry
      if (feature.accumulate !== undefined) {
        var accArr = feature.accumulate;
        if (!$.isArray(accArr))
          accArr = [accArr];
        
        for (var v = 0; v < accArr.length; ++v){
          var oldVal = ccLib.getJsonValue(entry, accArr[v]);
          var newVal = entry.values[fid];
          if (typeof fnValue === "function")
            ccLib.setJsonValue(entry, accArr[v], fnValue(oldVal, newVal));
          else if (!$.isArray(oldVal))
            ccLib.setJsonValue(entry, accArr[v], ccLib.isNull(oldVal) ? newVal : oldVal + newVal);
          else
            oldVal.push(newVal);
        }
      }
    }
    
    return entry;
  };
  
  cls.processFeatures = function(features) {
    features = $.extend(features, baseFeatures);
    for (var fid in features) {
      // starting from the feature itself move to 'sameAs'-referred features, until sameAs is missing or points to itself
      // This, final feature should be considered "main" and title and others taken from it.
      var feature = features[fid];
      var base = fid.replace(/(http.+\/feature\/).*/g, "$1");
      
      for (;;){
        if (feature.sameAs === undefined || feature.sameAs == null || feature.sameAs == fid || fid == base + feature.sameAs)
          break;
        if (features[feature.sameAs] !== undefined)
          feature = features[feature.sameAs];
        else {
          if (features[base + feature.sameAs] !== undefined)
            feature = features[base + feature.sameAs];
          else
            break;
        }
      }

      // now merge with this one... it copies everything that we've added, if we've reached to it. Including 'accumulate'
      features[fid] = $.extend(features[fid], feature);
    }
    
    return features;
  };
  
  cls.processDataset = function(dataset, features, fnValue) {
    if (ccLib.isNull(features)) {
      cls.processFeatures(dataset.feature);
      features = dataset.feature;
    }
    
    for (var i = 0, dl = dataset.dataEntry.length; i < dl; ++i) {
      cls.processEntry(dataset.dataEntry[i], features, fnValue);
      dataset.dataEntry[i].index = i + 1;
      var uri = dataset.dataEntry[i].compound.URI;
      uri = uri.replace(/(.+)(\/conformer.*)/, "$1");
      dataset.dataEntry[i].compound.diagramUri = uri + "?media=image/png";
    }
    
    return dataset;
  };
  
  return cls;
})();
