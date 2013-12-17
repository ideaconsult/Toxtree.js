/* toxdataset.js - General, universal dataset visualizer.
 *
 * Copyright 2012-2013, IDEAconsult Ltd. http://www.ideaconsult.net/
 * Created by Ivan Georgiev
**/

var jToxDataset = (function () {
  var defaultSettings = { };    // all settings, specific for the kit, with their defaults. These got merged with general (jToxKit) ones.
  var instanceCount = 0;

  // featureInfo(feature)
  var featureLinks = {
    "IUPACName": {"sameAs": "name"},
    "ChemicalName": {"sameAs": "name"},
    "CASRN": {"sameAs": "cas"},
    "EINECS": {"sameAs": "einecs"},
    "REACHRegistrationDate": {"sameAs": "reachdate"}
  }
  
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
    processFeatures: function (features) {
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
          self.processFeatures(feature.feature);
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
  cls.fixSameAs = function (sameAs) {
      sameAs = sameAs.substr(sameAs.indexOf('#') + 1); // trick - on 'not-found' it returns -1, which, adding 1 is exatly what we need :-)
      return featureLinks[sameAs] !== undefined ? featureLinks[sameAs].sameAs : sameAs;
  },
  
  cls.processEntry = function (entry, features, fnValue){
    for (var feat in entry.values) {
      var sameAs = cls.fixSameAs(features[feat].sameAs);
      if (commonFeatures[sameAs] === undefined || commonFeatures[sameAs].dataLocation === undefined)
        continue;
        
      var val = entry.values[feat];
      if (fnValue != null)
        val = fnValue(val);
      
      var data = commonFeatures[sameAs].dataLocation;
      var oldVal = ccLib.getJsonValue(entry, data);
      ccLib.setJsonValue(entry, data, ccLib.extendArray(oldVal, val).filter(ccNonEmptyFilter));
    }
    return entry;
  };
  
  cls.processDataset(dataset, fnValue) {
    var features = dataset.feature;
    for (var i = 0, dl = dataset.dataEntry.length; i < dl; ++i) {
      cls.processEntry(dataset.dataEntry[i], features, fnValue);
    }
  };
  
  return cls;
})();
