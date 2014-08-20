var jTConfig = {};

function jTConfigurator(kit) {
  return jTConfig.matrix;
}

function createGroups(miniset, kit) {
  var groups = {
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
	  ]
	};
	for (var fId in miniset.feature) {
	  var feat = miniset.feature[fId]; 
  	var src = feat.source;
  	if (!src || !src.type || src.type.toLowerCase() != 'model')
  	  continue;
    src = src.URI.substr(src.URI.lastIndexOf('/') + 1);
    if (groups[src] === undefined)
      groups[src] = [];
    if (feat.title.indexOf('explanation') > 0)
      feat.visibility = "details";
    groups[src].push(fId);
	}
	groups["Substances"] = [ "http://www.opentox.org/api/1.1#CompositionInfo" ];
	groups["Calculated"] = null;
	groups["Other"] = function (name, miniset) {
    var arr = [];
    for (var f in miniset.feature) {
      if (!miniset.feature[f].used && !miniset.feature[f].basic) {
        arr.push(f);
        if (feat.title.indexOf('explanation') > 0)
          feat.visibility = "details";
      }
    }
    return arr;
  }
	return groups;
}


/* toxmatrix.js - Read-across UI tool
 *
 * Copyright 2012-2014, IDEAconsult Ltd. http://www.ideaconsult.net/
 * Created by Ivan Georgiev
**/

var jToxAssessment = {
	createForm: null,
	rootElement: null,
	queries: {
		'assess_create': { method: "POST", service: "/dataset"},
		'assess_update': { method: "PUT", service: "/dataset/{id}/metadata"},
		'add_compound': { method: 'PUT', service: "/dataset/{datasetId}"},
		'del_compound': { method: 'DELETE', service: "/dataset/{datasetId}/compound?compound_uri={compoundUri}"},
		'get_compounds': { method: 'GET', service: "/dataset/{datasetId}/compounds"},
		'get_substances': { method: 'GET', service: "/dataset/{datasetId}/substances"},
		'add_substance': { method: 'PUT', service: "/dataset/{datasetId}/substances"},
		'del_substance': { method: 'DELETE', service: "/dataset/{datasetId}/substances?substance={substanceUri}"},
		'get_endpoints': { method: 'GET', service: ""},
		'add_endpoint': { method: 'PUT', service: "/dataset/{datasetId}/feature"},
		'del_endpoint': { method: 'DELETE', service: "/dataset/{datasetId}/feature?feature={featureUri}"},
	},
	
	settings: { // defaults settings go here
		
	},
	
	init: function (root, settings) {
		var self = this;

		self.rootElement = root;
    self.settings = $.extend(self.settings, jT.settings, settings);
		
		// the (sub)action in the panel
		var loadAction = function () {
			var el = this;
    	if (!el.checked)
    		return;
	    var method = $(el).parent().data('action');
	    if (!method)
	    	return;
	    ccLib.fireCallback(self[method], self, el.id, $(el).closest('ui-tabs-panel')[0]);
		};
		
    var loadPanel = function(panel){
      if (panel){
        var subs = $('.jq-buttonset.action input:checked', panel);
        if (subs.length > 0)
      	  subs.each(loadAction);
        else 
  		    ccLib.fireCallback(self[$(panel).data('action')], self, panel.id, panel);
      }
    };
    
    // initialize the tab structure for several versions of dataTables.
    $(root).tabs({
/*     	"disabled": [1, 2, 3, 4], */
      "select" : function(event, ui) {
        loadPanel(ui.panel);
      },
      "activate" : function(event, ui) {
        if (ui.newPanel)
          loadPanel(ui.newPanel[0]);
      },
      "create" : function(event, ui) {
        if (ui.panel)
          loadPanel(ui.panel[0]);
      }
    });
    
    $('.jq-buttonset', root).buttonset();
    $('.jq-buttonset.action input', root).on('change', loadAction);
    
    // finally, if provided - load the given assessmentUri
    if (!ccLib.isNull(self.settings.assessmentUri)) {
	    self.load(self.settings.assessmentUri);
    }
	},
	
	onIdentifiers: function (id, panel) {
	  var self = this;
    var checkForm = function () {
    	this.placeholder = "You need to fill this box";
    	return this.value.length > 0;
    };
    
    self.createForm = $('.jtox-identifiers form', self.rootElement)[0];
    self.createForm.assStart.onclick = function (e) {
    	if (ccLib.validateForm(self.createForm, checkForm)) {
		    jT.service(self, 'assess_create', null, function (task) {
			    console.log("Data set created: " + JSON.stringify(task));
		    });
		  }
		  return false;
    };
    self.createForm.assFinalize.style.display = 'none';
    self.createForm.assUpdate.style.display = 'none';
    self.createForm.assDuplicate.style.display = 'none';
    
    ccLib.prepareForm(self.createForm);
	},
	
	// called when a sub-action in assessment details tab is called
	onMatrix: function (id, panel) {
		console.log("Matrix: " + id);
	},
	
	// called when a sub-action in endpoint selection tab is called
	onEndpoint: function (id, panel) {
		console.log("Endpoint: " + id);
	},
	
	// called when a sub-action in structures selection tab is called
	onStructures: function (id, panel) {
		console.log("Structures: " + id);
	},
	
	load: function(assessmentUri) {
		
	},
};
