var config_dataset = {
  "baseFeatures": {
    "http://www.opentox.org/api/1.1#Diagram": {
      "title" : "Structure diagram",
      "data": "compound.diagramUri",
      "column": { "sClass": "paddingless", "sWidth": "150px"},
      "render" : function(data, type, full) {
        return (type != "display") ? "-" :
      	  (
//	                	  '<input type="checkbox" name="cmp" value="'+full.compound.URI+'"> '+
      	  '<a target="_blank" href="' + full.compound.URI + '"><img src="' + data + '" class="jtox-ds-smalldiagram"/></a>'
      	  //'<a target="_blank" href="' + full.compound.URI + '"><img src="http://localhost:8080/ambit2/model/3?media=image/png&dataset_uri=' + full.compound.URI + '" class="jtox-ds-smalldiagram"/></a>'
      	  );
      }
    },
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
		},
		"http://www.opentox.org/api/1.1#CompositionInfo" : {
		  "visibility": "details",
			"title": "Composition",
			"data": "compound.URI",
			"basic": true,
			"render" : function(data, type, full) {
        return (type != "details") ? "-" : '<span class="jtox-details-composition" data-URI="' + data + '"></span>';
      }
		}
  },
  "groups": {
    "Identifiers" : [
      "http://www.opentox.org/api/1.1#Diagram", 
      "#DetailsTableRow",
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
	  ],
    "Composition": [ "http://www.opentox.org/api/1.1#CompositionInfo" ]
	},
	"columns": {
  	"dataset": {
    	'Info': { bVisible: false }
  	},
  	"model": { 
    	'Info': { bVisible: false },
    	'Algorithm': { bVisible: false }
  	}
	},
	"handlers": {
  	"checked": onSelectedUpdate
	}
};
