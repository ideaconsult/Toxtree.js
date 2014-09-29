/* toxmatrix.js - Read-across UI tool
 *
 * Copyright 2012-2014, IDEAconsult Ltd. http://www.ideaconsult.net/
 * Created by Ivan Georgiev
**/

var jTConfig = {};

function jTConfigurator(kit) {
  return jTConfig.matrix;
}

function onSelectStructure(e) {
  var what = $(this).hasClass('target') ? 'target' : 'source';
  var uri = $(this).data('data');
  console.log("Structure [" + uri + "] selected as <" + what + ">");
}

function onSelectSubstance(e) {
  var uri = this.value;
  console.log("Substance [" + uri + "] selected");
}

function onSelectEndpoint(e) {
  var uri = this.value;
  console.log("Endpoint [" + uri + "] selected");  
}

function onDetailedRow(row, data, event) {
  var el = $('.jtox-details-composition', row)[0];
  if (!el)
    return;
  var uri = this.settings.baseUrl + '/substance?type=related&compound_uri=' + encodeURIComponent(data.compound.URI);
  el = $(el).parents('table')[0];
  el = el.parentNode;
  $(el).empty();
  $(el).addClass('paddingless');
  var div = document.createElement('div');
  el.appendChild(div);
  new jToxSubstance(div, $.extend(true, {}, this.settings, {crossDomain: true, selectionHandler: null, substanceUri: uri, showControls: false, onDetails: function (root, data, element) {
    new jToxStudy(root, $.extend({}, this.settings, {substanceUri: data.URI}));
  } } ) );
}

var jToxAssessment = {
	createForm: null,
	rootElement: null,
	queries: {
		'assess_create': { method: "POST", service: "/assessment"},
		'assess_update': { method: "PUT", service: "/assessment/{id}/metadata"},
		'add_compound': { method: 'PUT', service: "/assessment/{id}"},
		'del_compound': { method: 'DELETE', service: "/assessment/{id}/compound?compound_uri={compoundUri}"},
		'get_compounds': { method: 'GET', service: "/assessment/{id}/compounds"},
		'get_substances': { method: 'GET', service: "/assessment/{id}/substances"},
		'add_substance': { method: 'PUT', service: "/assessment/{id}/substances"},
		'del_substance': { method: 'DELETE', service: "/assessment/{id}/substances?substance={substanceUri}"},
		'get_endpoints': { method: 'GET', service: ""},
		'add_endpoint': { method: 'PUT', service: "/assessment/{id}/feature"},
		'del_endpoint': { method: 'DELETE', service: "/assessment/{id}/feature?feature={featureUri}"},
	},
	
	collected: {
  	compounds: [],
	},
		
  settings: {
  	studyTypeList: _i5.qaSettings["Study result type"],
  	configuration: {
    	columns: {
      	
    	}
  	}
  },
  
	init: function (root, settings) {
		var self = this;

		self.rootElement = root;
    self.settings = $.extend(self.settings, jT.settings, settings);
    
    // deal with some configuration
    if (typeof self.settings.studyTypeList == 'string')
      self.settings.studyTypeList = window[self.settings.studyTypeList];
		
		// the (sub)action in the panel
		var loadAction = function () {
    	if (!this.checked)
    		return;
      document.body.className = this.id;
	    var method = $(this).parent().data('action');
	    if (!method)
	    	return;
	    ccLib.fireCallback(self[method], self, this.id, $(this).closest('.ui-tabs-panel')[0], false);
		};
		
    var loadPanel = function(panel){
      if (panel){
        var subs = $('.jq-buttonset.action input:checked', panel);
        if (subs.length > 0)
      	  subs.each(loadAction);
        else 
  		    ccLib.fireCallback(self[$(panel).data('action')], self, panel.id, panel, true);
      }
    };
    
    // initialize the tab structure for several versions of dataTables.
    $(root).tabs({
/*     	"disabled": [1, 2, 3, 4], */
      "heightStyle": "fill",
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
    
    return self;
	},
	
	onIdentifiers: function (id, panel) {
	  var self = this;
    var checkForm = function () {
    	this.placeholder = "You need to fill this box";
    	return this.value.length > 0;
    };
    
    self.createForm = $('form', panel)[0];
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
	  var self = this;
		if (!$(panel).hasClass('initialized')) {
      jTConfig.matrix.groups = function (miniset, kit) {
        var groups = {
          "Identifiers" : [
            "http://www.opentox.org/api/1.1#Diagram", 
            "#DetailedInfoRow",
            "http://www.opentox.org/api/1.1#CASRN", 
            "http://www.opentox.org/api/1.1#EINECS",
            "http://www.opentox.org/api/1.1#IUCLID5_UUID",
            // Now some names
            "http://www.opentox.org/api/1.1#ChemicalName",
            "http://www.opentox.org/api/1.1#TradeName",
            "http://www.opentox.org/api/1.1#IUPACName",
            "http://www.opentox.org/api/1.1#SMILES",
            "http://www.opentox.org/api/1.1#InChIKey",
            "http://www.opentox.org/api/1.1#InChI",
            "http://www.opentox.org/api/1.1#REACHRegistrationDate"
          ]
      	};
      	
      	var endpoints = {};
      	var grp = [];
      	
      	var fRender = function (feat, theId) {
      	  return function (data, type, full) {
      	    if (type != 'display')
      	      return '-';

            var html = '';
            for (var fId in miniset.feature) {
              var f = miniset.feature[fId];
              if (f.sameAs != feat.sameAs || full.values[fId] == null)
                continue;
              if (html.length > 0)
                html += '<br/>';
              
              html += '<a class="info-popup" data-feature="' + fId + '" href="#">' + jT.ui.valueWithUnits(full.values[fId], f.units) + '</a>';
              html += '<sup class="helper"><a target="jtox-study" href="' + full.compound.URI + '/study?property_uri=' + encodeURIComponent(fId) + '">?</a></sup>';
            }
            
            if (!html)
              html += '<span class="ui-icon ui-icon-circle-plus edit-popup" data-feature="' + theId + '"></span>';

      	    return  html;
          };
        };
      	
      	for (var fId in miniset.feature) {
      	  var feat = miniset.feature[fId];
      	  if (feat.sameAs == null || feat.sameAs.indexOf("echaEndpoints.owl#") < 0)
      	    continue;
          
          if (endpoints[feat.sameAs] == undefined) {
            endpoints[feat.sameAs] = true;
            feat.render = fRender(feat, fId);
            feat.title = feat.sameAs.substr(feat.sameAs.indexOf('#') + 1);
            grp.push(fId);
          }
      	}
      		
      	groups["Endpoints"] = grp;
      	return groups;
      }
		
  		$(panel).addClass('initialized');
  		var conf = $.extend(true, {}, jTConfig.matrix, config_study);
  		delete conf.baseFeatures['#IdRow'];
  		  		
  		var infoDiv = $('#info-box')[0];
  		var editDiv = $('#edit-box')[0];
  		// now, fill the select with proper values...
  		var df = document.createDocumentFragment();
  		for (var id in self.settings.studyTypeList) {
  		  var opt = document.createElement('option');
  		  opt.value = id;
  		  opt.innerHTML = self.settings.studyTypeList[id].title;
  		  df.appendChild(opt);
  		}
  		
  		$('select.type-list', editDiv)[0].appendChild(df);
  		
  		self.matrixKit = new jToxCompound($('.jtox-toolkit', panel)[0], {
    		crossDomain: true,
    		rememberChecks: true,
    		tabsFolded: true,
    		showDiagrams: true,
    		showUnits: false,
    		hasDetails: false,
    		configuration: conf,
    		onRow: function (row, data, index) {
      		$('.info-popup, .edit-popup', row).on('click', function () {
      		  var boxOptions = { 
        		  overlay: true,
        		  closeOnEsc: true,
        		  closeOnClick: "overlay",
        		  addClass: "popup-box jtox-toolkit ui-front",
        		  animation: "zoomIn",
      		    target: $(this),
      		    maxWidth: 600,
      		    zIndex: 90,
      		    onCloseComplete: function () { this.destroy(); }
      		  };

            var featureId = $(this).data('feature');
    		    var feature = self.matrixKit.dataset.feature[featureId];
      		  if ($(this).hasClass('info-popup')) {
      		    
        		  $('.dynamic-condition', infoDiv).remove();
        		  var dynHead = $('tr.conditions', infoDiv)[0];
        		  var postCell = $('td.postconditions', infoDiv)[0];
        		  
        		  for (var i = 0, cl = feature.annotation.length; i < cl; ++i) {
          		  var ano = feature.annotation[i];
          		  // first add the column
          		  var el = document.createElement('th');
          		  el.className = 'dynamic-condition';
          		  el.innerHTML = ano.p;
          		  dynHead.appendChild(el);
          		  // now add the value
          		  el = document.createElement('td');
          		  el.className = 'dynamic-condition';
          		  el.innerHTML = ano.o;
          		  postCell.parentNode.insertBefore(el, postCell);
        		  }
        		  
        		  // make sure there is at least one cell.
              if (cl < 1) {
          		  el = document.createElement('td');
          		  el.className = 'dynamic-condition';
          		  el.innerHTML = '-';
          		  postCell.parentNode.insertBefore(el, postCell);
              }
              
        		  $('th.conditions', infoDiv).attr('colspan', cl);
        		  
        		  ccLib.fillTree(infoDiv, {
        		    endpoint: feature.title,
          		  type: feature.type,
          		  value: this.innerHTML,
          		  source: '<a target="_blank" href="' + feature.source.URI + '">' + feature.source.type + '</a>'
        		  });
        		  
        		  boxOptions.content = infoDiv.innerHTML;
              new jBox('Tooltip', boxOptions).open();
      		  }
      		  else { // edit mode
              var parse = featureId.substr(self.matrixKit.settings.baseUrl.length).match(/property\/([^\/]+)\/([^\/]+)\/.+/);
              
              boxOptions.content = jT.getTemplate('#jtox-endeditor').innerHTML + editDiv.innerHTML;
              boxOptions.title = parse[2];
              boxOptions.closeButton = "box";
              boxOptions.confirmButton = "Add";
              boxOptions.cancelButton = "Cancel";
              var endSetValue = function (e, field, value) {
                console.log("Value set [" + field + "] = `" + value + "`");
              };
              
              boxOptions.onOpen = function () {
                jToxEndpoint.linkEditors(self.matrixKit, this.content[0], parse[2].replace("+", " "), parse[1].replace("+", " "), endSetValue);
              };
              new jBox('Modal', boxOptions).open();
      		  }
      		});
    		}
  		});
  		
/*   		self.matrixKit.query("http://apps.ideaconsult.net:8080/data/substanceowner/IUC5-8DA74AF7-C7DD-4E38-8D8E-8FC765D5D15F/dataset"); */
  		self.matrixKit.query(jT.settings.baseUrl + "/substanceowner/IUC4-44BF02D8-47C5-385D-B203-9A8F315911CB/dataset");
		}
	},
	
	// called when a sub-action in endpoint selection tab is called
	onEndpoint: function (id, panel) {
	  var self = this;
	  var sub = $(".tab-" + id.substr(3), panel)[0];
	  sub.parentNode.style.left = (-sub.offsetLeft) + 'px';
	  
	  if (id == "endsubstance") {
  	  if (sub.firstElementChild == null) {
    	  var root = document.createElement('div');
    	  sub.appendChild(root);
    	  self.substanceKit = new jToxSubstance(root, { crossDomain: true, selectionHandler: "onSelectSubstance" });
  	  }
  	  
      self.substanceKit.query(jT.settings.baseUrl + "/substance?type=related&compound_uri=http%3A%2F%2Fapps.ideaconsult.net%3A8080%2Fdata%2Fcompound%2F21219%2Fconformer%2F39738");
	  }
	  else {// i.e. endpoints
  	  if (sub.firstElementChild == null) {
    	  var root = document.createElement('div');
    	  sub.appendChild(root);
    	  self.endpointKit = new jToxEndpoint(root, { selectionHandler: "onSelectEndpoint" });
    	  self.endpointKit.loadEndpoints();
  	  }
	  }
	},
	
	// called when a sub-action in structures selection tab is called
	onStructures: function (id, panel) {
	  if (!self.queryKit)
  	  self.queryKit = jT.kit($('#jtox-query')[0]);
    
    if (!!self.queryKit)
      self.queryKit.query();
	},
	
	load: function(assessmentUri) {
		
	},
};

$(document).ready(function(){
  $('#logger').on('mouseover', function () { $(this).removeClass('hidden'); }).on('mouseout', function () { $(this).addClass('hidden');});
});
