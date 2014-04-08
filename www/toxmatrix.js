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
  	$(document).ready(function() {	  	jToxMatrix.init($('#jtox-matrix')[0]);  	});jT.tools['toxmatrix'] = 
"<div class=\"jtox-toolkit\" id=\"jtox-matrix\">" +
"<ul>" +
"<li><a href=\"#jtox-identifiers\">Assessment identifier</a></li>" +
"<li><a href=\"#jtox-structures\">Structures used</a></li>" +
"<li><a href=\"#jtox-endpoints\">Endpoint data used</a></li>" +
"<li><a href=\"#jtox-details\">Assessment details</a></li>" +
"<li><a href=\"#jtox-report\">Report</a></li>" +
"</ul>" +
"<div id=\"jtox-identifiers\" class=\"jtox-identifiers\">" +
"<form>" +
"<table class=\"dataTable\">" +
"<thead>" +
"<tr><th class=\"right jtox-size-third\">Assessment</th><th class=\"data-field\" data-field=\"id\"></th></tr>" +
"<tr><td class=\"right jtox-size-third\">Name:</td><td><input class=\"data-field first-time validate\" data-field=\"name\" name=\"name\"></input></td></tr>" +
"<tr><td class=\"right jtox-size-third\">Number:</td><td><input class=\"data-field first-time validate\" data-field=\"number\" name=\"number\"></input></td></tr>" +
"<tr><td class=\"right top jtox-size-third\">Purpose:</td><td><textarea class=\"validate nomargin data-field\" data-field=\"purpose\" name=\"purpose\"></textarea></td></tr>" +
"<tr><td class=\"right jtox-size-third\">Owner:</td><td class=\"data-field\" data-field=\"owner\"></td></tr>" +
"<tr><td class=\"right jtox-size-third\">Version:</td><td class=\"data-field\" data-field=\"version\">?.?</td></tr>" +
"<tr><td class=\"right jtox-size-third\">Status:</td><td class=\"data-field\" data-field=\"status\"></td></tr>" +
"<tr><td class=\"right jtox-size-third\">Date started:</td><td class=\"data-field\" data-field=\"started\"></td></tr>" +
"<tr><td class=\"right jtox-size-third\">Date finished:</td><td class=\"data-field\" data-field=\"finished\"></td></tr>" +
"<tr>" +
"<td class=\"right jtox-size-third\">Flags:</td>" +
"<td>" +
"<div class=\"jq-buttonset\">" +
"<input type=\"hidden\" name=\"flags\"/>" +
"<input type=\"checkbox\" id=\"confidential\" class=\"accumulate\" data-accumulate=\"flags\" value=\"confidential\"><label for=\"confidential\">Confidential</label></input>" +
"<input type=\"checkbox\" id=\"internal\" class=\"accumulate\" data-accumulate=\"flags\" value=\"internal\"><label for=\"internal\">Internal</label></input>" +
"</div>" +
"</td>" +
"</tr>" +
"<tr>" +
"<td class=\"right jtox-size-third\">Published:</td>" +
"<td>" +
"<div class=\"jq-buttonset\">" +
"<input type=\"radio\" id=\"pub-yes\" name=\"published\" value=\"true\"><label for=\"pub-yes\">Yes</label></input>" +
"<input type=\"radio\" id=\"pub-no\" name=\"published\" value=\"false\" checked=\"checked\"><label for=\"pub-no\">No</label></input>" +
"</div>" +
"</td>" +
"</tr>" +
"<tr>" +
"<td class=\"right jtox-size-third\">Use allowed:</td>" +
"<td>" +
"<div class=\"jq-buttonset\">" +
"<input type=\"radio\" id=\"use-yes\" value=\"true\" name=\"useallowed\"><label for=\"use-yes\">Yes</label></input>" +
"<input type=\"radio\" id=\"use-no\" value=\"false\" name=\"useallowed\" checked=\"checked\"><label for=\"use-no\">No</label></input>" +
"</div>" +
"</td>" +
"</tr>" +
"</thead>" +
"</table>" +
"<div class=\"actions\">" +
"<button name=\"assStart\">Start</button>" +
"<button name=\"assFinalize\">Finalize</button>" +
"<button name=\"assDuplicate\">Duplicate</button>" +
"<button name=\"assUpdate\">Update</button>" +
"</div>" +
"</form>" +
"</div>" +
"<div id=\"jtox-structures\" class=\"jtox-structures\">" +
"<div class=\"jq-buttonset center action\" data-action=\"onStructures\">" +
"<input type=\"radio\" id=\"structtarget\" name=\"structaction\" checked=\"checked\"><label for=\"structtarget\">Define initial target</label></input>" +
"<input type=\"radio\" id=\"structallied\" name=\"structaction\"><label for=\"structallied\">Search allied structures</label></input>" +
"<input type=\"radio\" id=\"structselected\" name=\"structaction\"><label for=\"structselected\">Selected structures</label></input>" +
"</div>" +
"</div>" +
"<div id=\"jtox-endpoints\" class=\"jtox-endpoints\">" +
"<div class=\"jq-buttonset center action\" data-action=\"onEndpoint\">" +
"<input type=\"radio\" id=\"endsubstance\" name=\"endaction\" checked=\"checked\"><label for=\"endsubstance\">Find substance(s)</label></input>" +
"<input type=\"radio\" id=\"endpoints\" name=\"endaction\"><label for=\"endpoints\">Selection of endpoints</label></input>" +
"<input type=\"radio\" id=\"endmatrix\" name=\"endaction\"><label for=\"endmatrix\">Data matrix</label></input>" +
"</div>" +
"</div>" +
"<div id=\"jtox-details\" class=\"jtox-details\">" +
"<div class=\"jq-buttonset center action\" data-action=\"onDetails\">" +
"<input type=\"radio\" id=\"xdata\" name=\"xaction\" checked=\"checked\"><label for=\"xdata\">Add data</label></input>" +
"<input type=\"radio\" id=\"xgap\" name=\"xaction\"><label for=\"xgap\">Gap filling</label></input>" +
"<input type=\"radio\" id=\"xoverview\" name=\"xaction\"><label for=\"xoverview\">Final data matrix</label></input>" +
"</div>" +
"</div>" +
"<div id=\"jtox-report\" class=\"jtox-report\"></div>" +
"</div>" +
"";

