/* toxmatrix.js - Read-across UI tool
 *
 * Copyright 2012-2014, IDEAconsult Ltd. http://www.ideaconsult.net/
 * Created by Ivan Georgiev
**/

var jToxMatrix = {
	createForm: null,
	root: null,
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

		self.root = root;
    self.settings = $.extend(self.settings, jT.settings, settings);
		
		// the (sub)action in the panel
		var loadAction = function () {
			var el = this;
			setTimeout(function () {
	    	if (!el.checked)
	    		return;
		    var method = $(el).parent().data('action');
		    if (!method)
		    	return;
		    ccLib.fireCallback(self[method], self, el.id);
			}, 100);
		};
		
    var loadPanel = function(panel){
      if (panel){
      	$('.jq-buttonset.action input:checked', panel).each(loadAction);
      }
    };
    
    // initialize the tab structure for several versions of dataTables.
    $(root).tabs({
/*     	"disabled": [1, 2, 3, 4], */
      "select" : function(event, ui) {
        loadPanel(ui.panel);
      },
      "beforeActivate" : function(event, ui) {
        if (ui.newPanel)
          loadPanel(ui.newPanel[0]);
      }
    });
    
    $('.jq-buttonset', root).buttonset();
    var checkForm = function () {
    	this.placeholder = "You need to fill this box";
    	return this.value.length > 0;
    };
    
    self.createForm = $('.jtox-identifiers form', root)[0];
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

    $('.jq-buttonset.action input', root).on('change', loadAction);
    
    // finally, if provided - load the given assessmentUri
    if (!ccLib.isNull(self.settings.assessmentUri)) {
	    self.load(self.settings.assessmentUri);
    }
	},
	
	// called when a sub-action in assessment details tab is called
	onDetails: function (id) {
		console.log("Details: " + id);
	},
	
	// called when a sub-action in endpoint selection tab is called
	onEndpoint: function (id) {
		console.log("Endpoint: " + id);
	},
	
	// called when a sub-action in structures selection tab is called
	onStructures: function (id) {
		console.log("Structures: " + id);
	},
	
	load: function(assessmentUri) {
		
	},
};
