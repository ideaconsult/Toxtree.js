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
		
    var loadPanel = function(panel){
      if (panel){
      }
    };
    
    // initialize the tab structure for several versions of dataTables.
    $(root).tabs({
    	"disabled": [1, 2, 3, 4, 5],
      "select" : function(event, ui) {
        loadPanel(ui.panel);
      },
      "beforeActivate" : function(event, ui) {
        if (ui.newPanel)
          loadPanel(ui.newPanel[0]);
      }
    });
    
    $('.jq-buttonset', root).buttonset();
    
    self.createForm = $('.jtox-assessment form', root)[0];
    self.createForm.assFinalize.style.display = 'none';
    self.createForm.assUpdate.style.display = 'none';
    self.createForm.assDuplicate.style.display = 'none';
    
    // finally, if provided - load the given assessmentUri
    if (!ccLib.isNull(self.settings.assessmentUri)) {
	    self.load(self.settings.assessmentUri);
    }
	},
	
	load: function(assessmentUri) {
		
	},
};
