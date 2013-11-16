$(document).ready(function(){
  $('#jtox-substance').tabs();

  var theTable = $('.jtox-study-table')[0];
  $(theTable).dataTable( {
    "bPaginate": false,
    "bSort": false,
    "aoColumns": [
        { "sTitle": "Name", "mData": "protocol.endpoint", "sDefaultContent": "#1" },
        { "sTitle": "Species", "mData": "parameters.Species", "sDefaultContent": "-" },
        { "sTitle": "Value", "mData": "effects.result.loValue", "sDefaultContent": "-" },
        { "sTitle": "Sex", "mData": "effects.conditions.Sex", "sDefaultContent": "-"},
        { "sTitle": "Interpretation of the results", "mData" : "effects.classification", "sDefaultContent": "-"},
        { "sTitle": "Criteria", "sClass": "center", "mData": null, "sDefaultContent": "EU"  },
        { "sTitle": "Guide", "sClass": "center", "mData": "protocol.guidance", "sDefaultContent": "EUCD !!"  },
        { "sTitle": "Year", "sClass": "center", "mData": null, "sDefaultContent": "1986"  },
        { "sTitle": "Data owner", "sClass": "center", "mData": null, "sDefaultContent": "Deutche Post"  },
        { "sTitle": "Document UUID", "sClass": "center", "mData": "uuid" },
    ]
  });
  
  $(theTable).dataTable().fnAddData(toxStudies.study);
});
