var config_dataset = {
  "baseFeatures": {
    "http://www.opentox.org/api/1.1#Diagram": {
        "title" : "Structure diagram",
        "render" : function(col) {
      	    col["mData"] = "compound.diagramUri";
            col["mRender"] = function(data, type, full) {
              return (type != "display") ? "-" :
            	  (
//	                	  '<input type="checkbox" name="cmp" value="'+full.compound.URI+'"> '+
            	  '<a target="_blank" href="' + full.compound.URI + '"><img src="' + data + '" class="jtox-ds-smalldiagram"/></a>'
            	  //'<a target="_blank" href="' + full.compound.URI + '"><img src="http://localhost:8080/ambit2/model/3?media=image/png&dataset_uri=' + full.compound.URI + '" class="jtox-ds-smalldiagram"/></a>'
            	  );
            };
            col["sClass"] = "paddingless";
            col["sWidth"] = "150px";
            return col;
        }
    },
		"http://www.wikipathways.org/index.php/Pathway" :  {
			"title": "Wiki Pathways",
			"location" : "compound.wikipathway",
			"accumulate": true,
			"render" : function(col) {
				col["mRender"] = function(data, type, full) {
					return (type != "display") ? "-" : full.compound.wikipathway;
				};
				return col;
			}
		},
		"http://www.opentox.org/echaEndpoints.owl#Carcinogenicity" : {
              "title": "Carcinogenicity",
              "location" : "compound.carcinogenicity",
              "accumulate": true,
              "render" : function(col) {
                      col["mRender"] = function(data, type, full) {
                              return (type != "display") ? "-" : (
                                      (data=="active")?("<span style='color:red'>"+data+"</span>"):data
                              );
                      };
                      return col;
              }
    },
		"http://www.opentox.org/echaEndpoints.owl#Mutagenicity" : {
			"title": "Mutagenicity",
      "location" : "compound.mutagenicity",
			"accumulate": true,
			"render" : function(col) {
                                col["mRender"] = function(data, type, full) {
                                        return (type != "display") ? "-" : (
						(data=="active")?("<span style='color:red'>"+data+"</span>"):data
					);
                                };
                                return col;
                        }

		}
  },
  "groups": {
        "Identifiers" : [
           "http://www.opentox.org/api/1.1#Diagram", 
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
  	"checked": function (el) {
    	var tEl = $('.title', $(el).parents('.jtox-foldable')[0])[0];
    	var oldV = tEl.innerHTML.match(/(.+)\((\d+)\)(.*)?/);
    	var v = parseInt(oldV[2]);
    	if (el.checked)
    	  ++v;
    	 else
    	  --v;
    	
    	tEl.innerHTML = oldV[1] + '(' + v + ')' + oldV[3];
  	}
	}
};
