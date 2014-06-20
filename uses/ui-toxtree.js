function onAlgoLoaded(result) {
	var tEl = $('.title', $(this.rootElement).parents('.jtox-foldable')[0])[0];
	tEl.innerHTML = tEl.innerHTML.replace(/(.+)\((\d+)\/(\d+)(.*)?/, '$1($2/' + result.algorithm.length + '$4');;
}

function onSelectedUpdate(el) {
  var par = $('#tt-models-panel')[0];
	var tEl = $('.title', par)[0];
	var v = $('input[type="checkbox"]:checked', par).length;
	tEl.innerHTML = tEl.innerHTML.replace(/(.+)\((\d+)\/(\d+)(.*)?/, '$1(' + v + '/$3$4');;
}

function onDetailedRow(row, data, index) {
}

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
    	
  	}
	},
	"handlers": {
  	"checked": onSelectedUpdate
	}
};

$(document).ready(function(){
  $('#tt-models-panel a.select-all').on('click', function () {
    $('input[type="checkbox"]', this.parentNode).each(function () { this.checked = true;});
    onSelectedUpdate(this);
  });
  $('#tt-models-panel a.unselect-all').on('click', function () {
    $('input[type="checkbox"]', this.parentNode).each(function () { this.checked = false;});
    onSelectedUpdate(this);
  });
  
  var pressTimeout = null;
  $('#tt-models-panel input').on('keydown', function(e) {
    var needle = $(this).val();
    if (pressTimeout != null)
      clearTimeout(pressTimeout);
    pressTimeout = setTimeout(function () { 
      $(jToxModel.kits[0].table).dataTable().fnFilter(needle);
    }, 200);
  });
  
  var compKit = jToxCompound.kits[0];
});
