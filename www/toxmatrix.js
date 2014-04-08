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
    
    ccLib.prepareForm(self.createForm, function (el) {
	    alert("An empty element: " + el);
    });
    // finally, if provided - load the given assessmentUri
    if (!ccLib.isNull(self.settings.assessmentUri)) {
	    self.load(self.settings.assessmentUri);
    }
	},
	
	load: function(assessmentUri) {
		
	},
};
  	$(document).ready(function() {	  	jToxMatrix.init($('#jtox-matrix')[0]);  	});jT.tools['toxmatrix'] = 
"<div class=\"jtox-toolkit\" id=\"jtox-matrix\">" +
"<ul>" +
"<li><a href=\"#jtox-assessment\">Assessment</a></li>" +
"<li><a href=\"#jtox-structures\">Structures</a></li>" +
"<li><a href=\"#jtox-substances\">Substances</a></li>" +
"<li><a href=\"#jtox-endpoints\">Endpoints</a></li>" +
"<li><a href=\"#jtox-datamatrix\">Data Matrix</a></li>" +
"<li><a href=\"#jtox-report\">Report</a></li>" +
"</ul>" +
"<div id=\"jtox-assessment\" class=\"jtox-assessment\">" +
"<form>" +
"<table class=\"dataTable\">" +
"<thead>" +
"<tr><th class=\"right jtox-size-third\">Assessment</th><th class=\"data-field\" data-field=\"id\"></th></tr>" +
"<tr><td class=\"right jtox-size-third\">Name:</td><td><input class=\"data-field first-time non-empty\" data-field=\"name\" name=\"name\"></input></td></tr>" +
"<tr><td class=\"right jtox-size-third\">Number:</td><td><input class=\"data-field first-time non-empty\" data-field=\"number\" name=\"number\"></input></td></tr>" +
"<tr><td class=\"right top jtox-size-third\">Purpose:</td><td><textarea class=\"non-empty nomargin data-field\" data-field=\"purpose\" name=\"purpose\"></textarea></td></tr>" +
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
"<button name=\"assStart\" type=\"submit\">Start</button>" +
"<button name=\"assFinalize\" type=\"submit\">Finalize</button>" +
"<button name=\"assDuplicate\" type=\"submit\">Duplicate</button>" +
"<button name=\"assUpdate\" type=\"submit\">Update</button>" +
"</div>" +
"</form>" +
"</div>" +
"<div id=\"jtox-structures\" class=\"jtox-structures\"></div>" +
"<div id=\"jtox-substances\" class=\"jtox-substances\"></div>" +
"<div id=\"jtox-endpoints\" class=\"jtox-endpoints\"></div>" +
"<div id=\"jtox-datamatrix\" class=\"jtox-datamatrix\"></div>" +
"<div id=\"jtox-report\" class=\"jtox-report\"></div>" +
"</div>" +
"";

