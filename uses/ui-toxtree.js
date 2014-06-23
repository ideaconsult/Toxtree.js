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
    	'Description': { bVisible: false },
    	'Result': { iOrder: 3, sTitle: "Result", sClass: "tt-model-result", sDefaultContent: "-" }
  	},
  	"compound": {
  	  'Source': { bVisible: false },
  	  'Name': { sWidth: "25%" },
  	  'Value': { sWidth: "55%"},
  	  'SameAs': { sWidth: "20%'"}
  	}
	},
	"handlers": {
  	"checked": onSelectedUpdate,
  	"query": onQuery,
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

function onQuery(e, query) {
  $(tt.featureTable).dataTable().fnClearTable();
  $('#tt-diagram img.toxtree-diagram')[0].src = '';
  query.query();  
}

function onAlgoLoaded(result) {
	var tEl = $('#tt-models-panel .title')[0];
	$(tEl).data('total', result.algorithm.length);
	tEl.innerHTML = jT.ui.updateCounter(tEl.innerHTML, 0, result.algorithm.length);
}

function onSelectedUpdate(e) {
  var par = $('#tt-models-panel')[0];
	var tEl = $('.title', par)[0];
	var v = $('input[type="checkbox"]:checked', par).length;
	tEl.innerHTML = jT.ui.updateCounter(tEl.innerHTML, v, $(tEl).data('total'));;
}

function addFeatures() {
  var features = null;
  var kit = this;
  if (kit == tt.mainKit) { // Lot more things to be done here...
    kit = tt.mainKit;
    features = tt.coreFeatures;
    if (kit.dataset.dataEntry[tt.compoundIdx] != null)
      $('#tt-diagram img.toxtree-diagram')[0].src = kit.dataset.dataEntry[tt.compoundIdx].compound.diagramUri;

    var counter = $('#tt-browser-panel .counter-field')[0];
    counter.innerHTML = jT.ui.updateCounter(
      counter.innerHTML, 
      tt.compoundIdx + kit.pageStart + (kit.dataset.dataEntry[tt.compoundIdx] ? 1 : 0), 
      kit.entriesCount != null ? kit.entriesCount : kit.pageStart + kit.pageSize + '+'
    );
    
    if (tt.compoundIdx == 0 && kit.pageStart == 0) // we need to disable prev 
      $('#tt-browser-panel .prev-field').addClass('paginate_disabled_previous').removeClass('paginate_enabled_previous');
    else
      $('#tt-browser-panel .prev-field').removeClass('paginate_disabled_previous').addClass('paginate_enabled_previous');
      
    if (kit.entriesCount != null && tt.compoundIdx + kit.pageStart >= kit.entriesCount - 1)
      $('#tt-browser-panel .next-field').addClass('paginate_disabled_next').removeClass('paginate_enabled_next');
    else
      $('#tt-browser-panel .next-field').removeClass('paginate_disabled_next').addClass('paginate_enabled_next');
  }
  else {
    features = Object.keys(kit.dataset.feature);
    // TODO: some preprocessing for other kits? Like grouping row?
  }
  
  if (kit.dataset.dataEntry[tt.compoundIdx] != null) {
    $(tt.featureTable).dataTable().fnAddData(kit.featureData(kit.dataset.dataEntry[tt.compoundIdx], features));
    $(tt.featureTable).dataTable().fnAdjustColumnSizing();
    
  }
}

function showCompound(index) {
  if (index < 0 && tt.mainKit.pageStart > 0) { // we might need a reload...
    tt.compoundIdx = tt.mainKit.pageSize - 1;
    tt.mainKit.prevPage();
    for (var i in tt.featureKits)
      tt.featureKits[i].prevPage();
  }
  else if (index >= tt.mainKit.dataset.dataEntry.length) {
    tt.compoundIdx = 0;
    tt.mainKit.nextPage();
    for (var i in tt.featureKits)
      tt.featureKits[i].nextPage();
  }
  else { // normal showing up
    tt.compoundIdx = index;
    $(tt.featureTable).dataTable().fnClearTable();
    $('#tt-diagram img.toxtree-diagram')[0].src = '';
    
    addFeatures.call(tt.mainKit);
    for (var i in tt.featureKits)
      addFeatures.call(tt.featureKits[i]);
  }
}

function onDetailedAlgo(row, data, index) {
}

$(document).ready(function(){
  $('#tt-models-panel a.select-all').on('click', function () {
    $('#tt-models-panel input[type="checkbox"]').each(function () { this.checked = true;});
    onSelectedUpdate.call(this);
  });
  $('#tt-models-panel a.unselect-all').on('click', function () {
    $('#tt-models-panel input[type="checkbox"]').each(function () { this.checked = false;});
    onSelectedUpdate.call(this);
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
    "oLanguage": { sEmptyTable: "No features found for this compound..." },
    "aoColumns": jT.ui.processColumns(tt.mainKit, 'compound'),
    "bSort": true,
  });
  
  tt.modelKit = jToxModel.kits[0];
  
  $('#tt-browser-panel .prev-field').on('click', function () { if ($(this).hasClass('paginate_enabled_previous')) showCompound(tt.compoundIdx - 1); });
  $('#tt-browser-panel .next-field').on('click', function () { if ($(this).hasClass('paginate_enabled_next')) showCompound(tt.compoundIdx + 1); });
});
