jTConfig.dataset = {
  "baseFeatures": {
		"http://www.opentox.org/api/1.1#CompositionInfo" : {
		  "visibility": "details",
			"title": "Composition",
			"data": "compound.URI",
			"column": { bVisible: false },
			"basic": true,
			"render" : function(data, type, full) {
        return (type != "details") ? "-" : '<span class="jtox-details-composition"></span>';
      }
		}
  },
  "groups": createGroups,
  "handlers": {
    "runPredict": function (e) { runPredict(this); e.stopPropagation(); }
  },
	"columns": {
  	"dataset": {
    	'Info': { bVisible: false },
    	'Id': { sWidth: "25%" },
    	'Title': { sWidth: "45%" },
    	'Stars': { sWidth: "30%" }
  	},
  	"model": { 
    	'Info': { bVisible: false },
    	'Algorithm': { bVisible: false },
    	'Id': { sWidth: "25%" },
    	'Title': { sWidth: "45%" },
    	'Stars': { sWidth: "30%" }
  	},
  	"substance": {
    	'Contained in as': { iOrder: 20, mData: "composition", sTitle: "Contained in as", mRender: jT.ui.renderRelation }
  	}
	}
};
