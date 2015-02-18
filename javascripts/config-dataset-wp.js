var config_dataset = {

  "pageSize": 50,
  "pageStart": 0,
  "showTabs": false,
  "hasDetails": false,

  "fnAccumulate": function(fId, oldVal, newVal, features) {
    if ( features[fId].sameAs == "http://www.wikipathways.org/index.php/Pathway" ) {

      if ((oldVal === undefined) || (oldVal == null) || ("" == oldVal)) oldVal = [];
        if ((newVal === undefined) || ccLib.isNull(newVal)) return oldVal;

        newVal = '<a href="' + features[fId].title + '" target="_blank" class="qxternal">' + newVal + '</a>';

        if ($.inArray(newVal,oldVal)==-1)
              oldVal.push(newVal);

        return oldVal;

    } else {
      if (ccLib.isNull(newVal))
        return oldVal;
      newVal = newVal.toString();
      if (ccLib.isNull(oldVal) || newVal.toLowerCase().indexOf(oldVal.toLowerCase()) >= 0)
        return newVal;
      if (oldVal.toLowerCase().indexOf(newVal.toLowerCase()) >= 0)
        return oldVal;
      return oldVal + ", " + newVal;
    }
  },

  "configuration": {

    "baseFeatures": {
      "http://www.opentox.org/api/1.1#ChemicalName": {
        "title": "Chemical Name",
        "data": "compound.name",
        "primary": true,
        "basic": true,
        "accumulate": true,
        "column": { sClass: "breakable word-break", sWidth: "20%" },
        "render": function(data, type, full){
          return (type == 'display') ? full.compound.name : data;
        }
      },
      "http://www.opentox.org/api/1.1#TradeName": {
        "title": "Chemical Name",
        "sameAs": "http://www.opentox.org/api/1.1#ChemicalName",
        "accumulate": true,
        "data": "compound.name"
      },
      "http://www.opentox.org/api/1.1#InChI": {
        "title": "InChI",
        "data": "compound.inchi",
        "shorten": false,
        "accumulate": true,
        "primary": true,
        "basic": true
      },
      "http://www.wikipathways.org/index.php/Pathway" :  {
        "title": "Wiki Pathways",
        "data" : "compound.wikipathway",
        "primary": true,
        "basic": true,
        "accumulate": true,
        "column": { sTitle: "Wiki Pathways"},
        "render": function(data, type, full){
          if(type!='display'){
            return data;
          }
          else {
            if ( data instanceof Array ){
              return data.join(',<br>');
            }
            else {
              return data;
            }
          }
        }
      },
      "https://apps.ideaconsult.net/data/feature/2830" : {
        "sameAs": "http://www.wikipathways.org/index.php/Pathway",
        "acumulate": true
      }
    },

    "groups": {
      "Columns" : [
        "http://www.opentox.org/api/1.1#Diagram",
        "http://www.opentox.org/api/1.1#ChemicalName",
        "http://www.opentox.org/api/1.1#InChI",
        "http://www.wikipathways.org/index.php/Pathway"
      ]
    }

  } // settings

};
