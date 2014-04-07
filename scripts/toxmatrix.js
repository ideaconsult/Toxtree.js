/* toxmatrix.js - Read-across UI tool
 *
 * Copyright 2012-2014, IDEAconsult Ltd. http://www.ideaconsult.net/
 * Created by Ivan Georgiev
**/

var jToxMatrix = {
	init: function (root, settings) {
    var loadPanel = function(panel){
      if (panel){
      }
    };
    
    // initialize the tab structure for several versions of dataTables.
    jT.$(root).tabs({
    	"disabled": [1, 2, 3, 4, 5],
      "select" : function(event, ui) {
        loadPanel(ui.panel);
      },
      "beforeActivate" : function(event, ui) {
        if (ui.newPanel)
          loadPanel(ui.newPanel[0]);
      }
    });
    
    jT.$('.jq-buttonset', root).buttonset();
	},
};
