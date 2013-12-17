/* toxdataset.js - General, universal dataset visualizer.
 *
 * Copyright 2012-2013, IDEAconsult Ltd. http://www.ideaconsult.net/
 * Created by Ivan Georgiev
**/

var jToxDataset = (function () {
  var defaultSettings = { };    // all settings, specific for the kit, with their defaults. These got merged with general (jToxKit) ones.
  var instanceCount = 0;

  var baseFeatures = {
    "http://www.opentox.org/api/1.1#REACHRegistrationDate" : { title: "REACH Date", accumulate: "compound.reachdate"},
    "http://www.opentox.org/api/1.1#CASRN" : { title: "CAS", accumulate: "compound.cas"},
  	"http://www.opentox.org/api/1.1#ChemicalName" : { title: "Name", accumulate: "compound.name"},
  	"http://www.opentox.org/api/1.1#TradeName" : {title: "Trade Name", accumulate: "compound.name"},
  	"http://www.opentox.org/api/1.1#IUPACName": {title: "IUPAC Name", accumulate: "compound.name"},
  	"http://www.opentox.org/api/1.1#EINECS": {title: "EINECS", accumulate: "compound.einecs"},
    "http://www.opentox.org/api/1.1#InChI": {title: "InChI", accumulate: "compound.inchi"},
  	"http://www.opentox.org/api/1.1#InChI_std": {title: "InChI", accumulate: "compound.inchi"},
    "http://www.opentox.org/api/1.1#InChIKey": {title: "InChI Key", accumulate: "compound.inchikey"},
  	"http://www.opentox.org/api/1.1#InChIKey_std": {title: "InChI Key", accumulate: "compound.inchikey"},
    "http://www.opentox.org/api/1.1#InChI_AuxInfo": {title: "InChI Aux", accumulate: "compound.inchi"},
  	"http://www.opentox.org/api/1.1#InChI_AuxInfo_std": {title: "InChI Aux", accumulate: "compound.inchi"},
  	"http://www.opentox.org/api/1.1#IUCLID5_UUID": {title: "IUCLID5 UUID", accumulate: "compound.i5uuid"},
  	"http://www.opentox.org/api/1.1#SMILES": {title: "SMILES", accumulate: "compound.smiles"},
  	"http://www.opentox.org/api/dblinks#CMS": {title: "CMS", accumulate: "compound.cms"},
  	"http://www.opentox .org/api/dblinks#ChEBI": {title: "ChEBI"},
  	"http://www.opentox.org/api/dblinks#Pubchem": {title: "Public Chem"},
  	"http://www.opentox.org/api/dblinks#ChemSpider": {title: "Chem Spider"},
  	"http://www.opentox.org/api/dblinks#ChEMBL": {title: "ChEMBL"},
  	"http://www.opentox.org/api/dblinks#ToxbankWiki": {title: "Toxban Wiki"}
  };

  var commonFeatures = {
/*     "IUCLID5_UUID": {"sameAs": "i5uuid"} */
    "diagram": {"column": 0, "title": "Diagram", "group": "Common", "dataLocation": "compound.URI"},
    "cas": {"column": 1, "title": "CAS", "group": "Common", "dataLocation": "compound.cas"},
    "einecs": {"colun": 2, "title": "EINECS", "group": "Common", "dataLocation": "compound.einecs"},
    "name": {"column": 3, "title": "Name", "group": "Common", "dataLocation": "compound.name"},
    "SMILES": {"column": 4, "title": "Smiles", "units": "", "group": "Common", "dataLocation": "compound.smiles"},
    "InChI": {"column": 5, "title": "InChI", "units": "", "group": "Common", "dataLocation": "compound.inchi"},
    "reachdate": {"column": 6, "title": "REACHRegistration", "units": "", "group": "Common", "dataLocation": "compound.reachdate"}
  };
  
  // constructor
  var cls = function (root, settings) {
    var self = this;
    self.rootElement = root;
    self.settings = $.extend({}, defaultSettings, jToxKit.settings, settings); // i.e. defaults from jToxDataset
    self.features = null; // almost exactly as downloaded form server - just a group member is added based on sameAs
    self.featureGroups = {"Common": []};
    self.featureOrder = ["Common"];

    instanceCount++;
  };
  
  // now follow the prototypes of the instance functions.
  cls.prototype = {
    // make a tab-based widget with features and grouped on tabs. If entry is provided the widget is filled with values
    prepareTabs: function (root, entry) {
      var self = this;
      
      var fr = document.createDocumentFragment();
      var all = document.createElement('div');
      fr.appendChild(all);
      ulEl = document.createElement('ul');
      all.appendChild(ulEl);

      var featNames = {};
      for (var gr in self.featureGroups) {
        var grId = "jtox-ds-" + gr + "-" + instanceCount;
        
        var liEl = document.createElement('li');
        ulEl.appendChild(liEl);
        var aEl = document.createElement('a');
        aEl.href = "#" + grId;
        aEl.innerHTML = gr.replace(/_/g, " ");
        liEl.appendChild(aEl);
        
        // now prepare the content.
        var divEl = document.createElement('div');
        divEl.id = grId;
        for (var i = 0;i < self.featureGroups[gr].length; ++i) {
          var feat = self.featureGroups[gr][i];
          var fEl = jToxKit.getTemplate('#jtox-ds-feature');
          featNames[feat] = self.features[feat].title;
          fEl.setAttribute('data-feature', feat);
          divEl.appendChild(fEl);
        }
        
        all.appendChild(divEl);
      }
      
      root.appendChild(fr);
      // fill, the already prepared names for each checkbox-ed item.
      $('.jtox-ds-feature', all).each(function() {
        var fId = $(this).data('feature');
        $('.jtox-title', this).html(featNames[fId]);
      });
      return $(all).tabs();
    },
    
    prepareTables: function() {
      var fixedCols = [];
      var varCols = [];
      
      for (var i = 0, glen = self.featureOrder.length; i < glen; ++i) {
        var grp = self.featureOrder[i];
        var gfull = self.featureGroups[grp];
        
        for (var j = 0, flen = gfull.length; j < flen; ++j){
          var f = gfull[j];
          var ffull = self.features[f];
          var col = {
            "sTitle": ffull.title + ffull.units,
            "sDefaultContent": "?",
            "mData": ffull.dataLocation !== undefined ? ffull.dataLocation : "values"
          };
          
          if (ffull.dataLocation === undefined){
            col["mRender"] = (function (fid) { 
              return function (data, type, full) {
                return data[fid];
              };
            })(f);
          }
          
          if (grp == "common")
            fixedCols.push(col);
          else
            varCols.push(col);
        }
      }
      
      // now - create the tables.
      var fixTable = null;
      var varTable = null;
    },

    /* Process features as reported in the dataset. Works on result of standalone calls to <datasetUri>/feature
    */
    groupFeatures: function (features) {
      var self = this;
      
      self.features = features;
      if (!!features) {
        for (var f in features) {
          
          var fullf = features[f];
          var gr = cls.fixSameAs(fullf.sameAs);
          if (commonFeatures[gr] === undefined) {
            gr = gr.replace(/\s/g, '_');
            if (self.featureGroups[gr] === undefined){ // add new one
              self.featureOrder.push(gr);
              self.featureGroups[gr] = [];
            }
            
            self.featureGroups[gr].push(f);
          }

          fullf.group = gr;
        }
       
        // finally - append our, custom groups at the end, so that they appear as usual groups
        for (var f in commonFeatures)
          self.featureGroups["Common"].push(f);
        
        $.extend(self.features, commonFeatures);
      }
    },
    
    /* Clears the page from any dataset fillings, so a new call can be made.
    */
    clearDataset: function () {
      var self = this;
    },
    
    /* Makes a query to the server for particular dataset. If 'grouping' is null, a call for dataset's features is made first
    */
    queryDataset: function (datasetUri) {
      var self = this;
      
      self.clearDataset();
      jToxKit.call(self, datasetUri + '/feature', function (feature) {
        if (!!feature) {
          self.groupFeatures(feature.feature);
          self.prepareTabs($('.jtox-ds-features', self.rootElement)[0]);
          self.prepareTables();
      
          // finally - make a call for the dataset and fill up the tables.
          jToxKit.call(self, datasetUri, function(dataset){
            if (!!dataset){
              cls.processDataset(dataset);
              $('.jtox-ds-fixed table', self.rootElement).dataTable().fnAddData(dataset.dataEntry);
              $('.jtox-ds-variable table', self.rootElement).dataTable().fnAddData(dataset.dataEntry);
            }
          });
        }
      });
    },
    
  }; // end of prototype
  
  // some public, static methods
  cls.processEntry = function (entry, features, fnValue) {
    for (var fid in entry.values) {
      var feature = features[fid];
      
      // if applicable - accumulate the feature value to a specific location whithin the entry
      if (feature.accumulate !== undefined) {
        var oldVal = ccLib.getJsonValue(entry, feature.accumulate);
        var newVal = entry.values[fid];
        if (typeof fnValue !== undefined)
          ccLib.setJsonValue(entry, feature.accumulate, fnValue(oldVal, newVal));
        else if (!$.isArray(oldVal))
          ccLib.setJsonValue(entry, feature.accumulate, oldVal + newVal);
        else
          oldVal.push(newVal);
      }
    }
    
    return entry;
  };
  
  cls.processFeatures = function(features) {
    features = $.extend(features, baseFeatures);
    for (var fid in features) {
      // find the feature title first
      var feature = features[fid];
      
      for (;;){
        if (feature.sameAs === undefined || feature.sameAs == null)
          break;
        if (features[feature.sameAs] !== undefined)
          feature = features[feature.sameAs];
        else {
          var base = fid.replace(/(http.+\/feature\/).*/g, "$1");
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
  
  cls.processDataset = function(dataset, fnValue) {
    cls.processFeatures(dataset.feature);
    
    for (var i = 0, dl = dataset.dataEntry.length; i < dl; ++i) {
      cls.processEntry(dataset.dataEntry[i], dataset.feature, fnValue);
    }
  };
  
  return cls;
})();
