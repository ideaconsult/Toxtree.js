var config_toxtree = {
  "baseFeatures": {
		"http://www.wikipathways.org/index.php/Pathway" :  {
			"title": "Wiki Pathways",
			"data" : "compound.wikipathway",
			"accumulate": true,
			"render" : function(data, type, full) {
				return (type != "display") ? data : full.compound.wikipathway;
			}
		},
		"http://www.opentox.org/echaEndpoints.owl#Carcinogenicity" : {
      "title": "Carcinogenicity",
      "data" : "compound.carcinogenicity",
      "accumulate": true,
      "render" : function(data, type, full) {
        return (type != "display") ? data : (
                (data=="active")?("<span style='color:red'>"+data+"</span>"):data
        );
      }
    },
		"http://www.opentox.org/echaEndpoints.owl#Mutagenicity" : {
			"title": "Mutagenicity",
      "data" : "compound.mutagenicity",
			"accumulate": true,
			"render" : function(data, type, full) {
        return (type != "display") ? data : (
				  (data=="active")?("<span style='color:red'>"+data+"</span>"):data);
      }
		}
  },
	"columns": {
  	"algorithm": { 
    	'Info': { bVisible: false },
    	'Description': { bVisible: false }
  	},
  	"compound": {
  	  'Source': { bVisible: false },
    	
  	}
	},
	"handlers": {
  	"checked": onSelectedUpdate
	}
};

var tt = {
  mainKit: null,
  featureTable: null,
  modelKit: null,
  compoundIdx: 0,
  compoundSet: {},
  featureKits: {},
  coreFeatures: [
    "http://www.opentox.org/api/1.1#CASRN", 
    "http://www.opentox.org/api/1.1#EINECS",
    "http://www.opentox.org/api/1.1#IUCLID5_UUID",
    "http://www.opentox.org/api/1.1#ChemicalName",
    "http://www.opentox.org/api/1.1#TradeName",
    "http://www.opentox.org/api/1.1#IUPACName",
    "http://www.opentox.org/api/1.1#SMILES",
    "http://www.opentox.org/api/1.1#InChIKey",
    "http://www.opentox.org/api/1.1#InChI",
    "http://www.opentox.org/api/1.1#REACHRegistrationDate"
  ]
};

function onAlgoLoaded(result) {
	var tEl = $('#tt-models-panel .title')[0];
	tEl.innerHTML = tEl.innerHTML.replace(/(.+)\((\d+)\/(\d+)(.*)?/, '$1($2/' + result.algorithm.length + '$4');;
}

function onSelectedUpdate(el) {
  var par = $('#tt-models-panel')[0];
	var tEl = $('.title', par)[0];
	var v = $('input[type="checkbox"]:checked', par).length;
	tEl.innerHTML = tEl.innerHTML.replace(/(.+)\((\d+)\/(\d+)(.*)?/, '$1(' + v + '/$3$4');;
}

function addFeatures(kit) {
  var features = null
  if (!kit || kit == tt.mainKit) {
    kit = tt.mainKit;
    features = tt.coreFeatures;
    $('#tt-diagram img.toxtree-diagram')[0].src = kit.dataset.dataEntry[tt.compoundIdx].compound.diagramUri;

    var total = kit.entriesCount;
    if (total == null)
      total = kit.pageStart + kit.pageSize + '+';
    
    var counter = $('#tt-controls .counter-field')[0];
    counter.innerHTML = kit.dataset.dataEntry[tt.compoundIdx].compound.name + ' (' + (tt.compoundIdx + kit.pageStart + 1) + '/' + total + ')';
  }
  else {
    features = Object.keys(kit.dataset.feature);
    // TODO: some preprocessing for other kits? Like grouping row?
  }
  
  $(tt.featureTable).dataTable().fnAddData(kit.featureData(kit.dataset.dataEntry[tt.compoundIdx], features));
}

function showCompound(index) {
  if (index < 0 && tt.mainKit.pageStart > 0) { // we might need a reload...
    tt.compoundIdx = tt.mainKit.pageSize - 1;
    tt.mainKit.prevPage();
    for (var i in tt.featureKits)
      tt.featureKits[i].prevPage();
  }
  else if (index >= tt.mainKit.pageSize) {
    tt.compoundIdx = 0;
    tt.mainKit.nextPage();
    for (var i in tt.featureKits)
      tt.featureKits[i].nextPage();
  }
  else { // normal showing up
    tt.compoundIdx = index;
    $(tt.featureTable).dataTable().fnClearTable();
    addFeatures(null);
    for (var i in tt.featureKits)
      addFeatures(tt.featureKits[i]);
  }
}

function onCompoundsLoaded (result) {
  addFeatures(this);
  // TODO: deal with next/prev and counter fields
  if (!!tt.mainKit.dataset && tt.mainKit == this) {
    if (tt.compoundIdx == 0 && this.pageStart == 0) // we need to disable prev 
      $('#tt-controls .prev-field').addClass('paginate_disabled_previous').removeClass('paginate_enabled_previous');
    else
      $('#tt-controls .prev-field').removeClass('paginate_disabled_previous').addClass('paginate_enabled_previous');
      
    if (this.entriesCount != null && tt.compoundIdx + this.pageStart == this.entriesCount - 1)
      $('#tt-controls .next-field').addClass('paginate_disabled_next').removeClass('paginate_enabled_next');
    else
      $('#tt-controls .next-field').removeClass('paginate_disabled_next').addClass('paginate_enabled_next');
  }
}

function onDetailedAlgo(row, data, index) {
}

$(document).ready(function(){
  $('#tt-models-panel a.select-all').on('click', function () {
    $('#tt-models-panel input[type="checkbox"]').each(function () { this.checked = true;});
    onSelectedUpdate(this);
  });
  $('#tt-models-panel a.unselect-all').on('click', function () {
    $('#tt-models-panel input[type="checkbox"]').each(function () { this.checked = false;});
    onSelectedUpdate(this);
  });
  
  tt.mainKit = jToxCompound.kits[0];
  tt.featureTable = document.createElement('table');
  tt.mainKit.rootElement.appendChild(tt.featureTable);
  
  jT.$(tt.featureTable).dataTable({
    "bPaginate": true,
    "bProcessing": true,
    "bLengthChange": false,
		"bAutoWidth": true,
    "sDom" : "rt<f>",
    "sScrollX": "100%",
    "sScrollY": "100%",
    "aoColumns": jT.ui.processColumns(tt.mainKit, 'compound'),
    "bSort": true,
  });
  
  tt.modelKit = jToxModel.kits[0];
  
  $('#tt-controls .prev-field').on('click', function () { if ($(this).hasClass('paginate_enabled_previous')) showCompound(tt.compoundIdx - 1); });
  $('#tt-controls .next-field').on('click', function () { if ($(this).hasClass('paginate_enabled_next')) showCompound(tt.compoundIdx + 1); });
});
