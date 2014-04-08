/* toxmatrix.js - Read-across UI tool
 *
 * Copyright 2012-2014, IDEAconsult Ltd. http://www.ideaconsult.net/
 * Created by Ivan Georgiev
**/

var jToxMatrix = {
	createForm: null,
	root: null,
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
    
    self.createForm = $('.jtox-identifiers form', root)[0];
    self.createForm.assFinalize.style.display = 'none';
    self.createForm.assUpdate.style.display = 'none';
    self.createForm.assDuplicate.style.display = 'none';
    
    ccLib.prepareForm(self.createForm, function (el) {
    	this.placeholder = "You need to fill this box";
    });

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
