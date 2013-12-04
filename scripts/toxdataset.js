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
    "diagram": {"title": "Diagram", "group": "Common", "dataLocation": "compound.URI"},
    "cas": {"title": "CAS", "group": "Common", "dataLocation": "compound.cas"},
    "einecs": {"title": "EINECS", "group": "Common", "dataLocation": "compound.einecs"},
    "name": {"title": "Name", "group": "Common", "dataLocation": "compound.name"},
    "SMILES": {"title": "Smiles", "units": "", "group": "Common"},
    "InChI": {"title": "InChI", "units": "", "group": "Common"},
    "reachdate": {"title": "REACHRegistration", "units": "", "group": "Common"}
  };
  
  // constructor
  var cls = function (root, settings) {
    var self = this;
    self.rootElement = root;
    self.settings = $.extend({}, defaultSettings, jToxKit.settings, settings); // i.e. defaults from jToxDataset
    self.features = null; // almost exactly as downloaded form server - just a group member is added based on sameAs
    self.featureGroups = {};

    instanceCount++;
  };
  
  // now follow the prototypes of the instance functions.
  cls.prototype = {
    // make a tab-based widget with features and grouped on tabs. If entry is provided the widget is filled with values
    prepareTabs: function (root, entry) {
      var self = this;
      
      return tabs;
    },

    /* Process features as reported in the dataset. Works on result of standalone calls to <datasetUri>/feature
    */
    processFeatures: function (features) {
      var self = this;
      
      self.featureList = features;
      if (!!features) {
        for (var f in features) {
          
          var fullf = features[f];
          var gr = cls.featureInfo(fullf.sameAs);
          self.featureGroups[info.group] = ccLib.extendArray(self.featureGroups[info.group], [f]);
          fullf['group'] = info.group;
        }
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
      jToxKit.call(self, datasetUri, function(dataset){
        if (!!dataset){
          self.processFeatures(dataset.feature);
          var mainTabs = self.prepareTabs(self.rootElement);
          
          // now go to prepare the table(s)
          var fixedDefs = [];
          var varDefs = [];
          
          for (var i in self.featureGroups) {
            var grp = self.featureGroups[i];
            if (grp == "Common"){
              fixedDefs = []
              for (var j = 0, glen = grp.length;j < glen; ++j) {
                var f = grp[j];
                varDefs.push({
        					"mData" : "values." + f,
        					"sTitle" : self.features[f].title,
        					"sDefaultContent": "?"
      					});
      				}
              
            }
            else { // Others
              for (var j = 0, glen = grp.length;j < glen; ++j) {
                var f = grp[j];
                varDefs.push({
        					"mData" : "values." + f,
        					"sTitle" : self.features[f].title,
        					"sDefaultContent": "?"
      					});
      				}
            }
          }
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
  
  return cls;
})();
