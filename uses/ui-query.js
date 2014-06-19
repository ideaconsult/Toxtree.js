function onSideLoaded(result) {
	var tEl = $('.title', $(this.rootElement).parents('.jtox-foldable')[0])[0];
	var set = result.dataset || result.model;
	tEl.innerHTML = tEl.innerHTML.replace(/(.+)\((\d+)\/(\d+)(.*)?/, '$1($2/' + set.length + '$4');;
}

function onSelectedUpdate(el) {
  var par = $(el).parents('.jtox-foldable')[0];
	var tEl = $('.title', par)[0];
	var v = $('input[type="checkbox"]:checked', par).length;
	tEl.innerHTML = tEl.innerHTML.replace(/(.+)\((\d+)\/(\d+)(.*)?/, '$1(' + v + '/$3$4');;
}

function onDetailedRow(row, data, index) {
  var el = $('.jtox-details-composition', row);
  var uri = $(el).data('uri');
  uri = this.settings.baseUrl + '/substance?compound_uri=' + encodeURIComponent(uri);
  el = $(el).parents('table')[0];
  el = el.parentNode;
  $(el).empty();
  $(el).addClass('paddingless');
  var div = document.createElement('div');
  el.appendChild(div);
  var ds = new jToxSubstance(div, {crossDomain: true, substanceUri: uri, showControls: false, onDetails: function (root, data, event) {
    var comp = new jToxStudy(root);
    comp.querySubstance(data);
  } } );
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
  	var src = miniset.feature[fId].source;
  	if (!src || !src.type || src.type.toLowerCase() != 'model')
  	  continue;
    src = src.URI.substr(src.URI.lastIndexOf('/') + 1);
    if (groups[src] === undefined)
      groups[src] = [];
    if (fId.indexOf('explanation') > 0)
      miniset.feature[fId].visibility = "details";
    groups[src].push(fId);
	}
	groups["Substances"] = [ "http://www.opentox.org/api/1.1#CompositionInfo" ];
	groups["Calculated"] = null;
	groups["Other"] = function (name, miniset) {
    var arr = [];
    for (var f in miniset.feature) {
      if (!miniset.feature[f].used && !miniset.feature[f].basic) {
        arr.push(f);
        if (f.indexOf('#explanation') > 0)
          miniset.feature[f].visibility = "details";
      }
    }
    return arr;
  }
	return groups;
}

$(document).ready(function(){
  var toggleBar = function () {
    $(this).parents('#sidebar').toggleClass('hidden');
  };
  $('#sidebar span.ui-icon').on('click', toggleBar);
  $('#sidebar div.side-title').on('click', toggleBar);
  $('#sidebar').on('mouseover', function () { $(this).removeClass('hidden'); }).on('mouseout', function () { $(this).addClass('hidden');});
  
  $('#sidebar a.select-all').on('click', function () {
    $('input[type="checkbox"]', this.parentNode).each(function () { this.checked = true;});
    onSelectedUpdate(this);
  });
  $('#sidebar a.unselect-all').on('click', function () {
    $('input[type="checkbox"]', this.parentNode).each(function () { this.checked = false;});
    onSelectedUpdate(this);
  });
});