var jToxStudy = {
  getFormatted: function (data, type, format) {
    var value = null;
    if (typeof format === 'function' )
      value = format.call(this, data, type);
    else if (typeof format === 'string' || typeof format === 'number')
      value = data[format];
    else
      value = data[0];
    
    return value;
  },
  
  renderMulti: function (data, type, full, format) {
    var self = this;
    var dlen = data.length;
    if (dlen < 2)
      return self.getFormatted(data[0], type, format);

    var height = 100 / dlen;
    var df = '<table>';
    for (var i = 0, dlen = data.length; i < dlen; ++i) {
      df += '<tr class="' + (i % 2 == 0 ? 'even' : 'odd') + '"><td style="height: ' + height + '%">' + self.getFormatted(data[i], type, format) + '</td></tr>';
    }
    
    df += '</table>';
    return df;
  },
  
  formatResult: function (data, type) {
    return "" + data.result.loValue + data.result.unit;
  },
  
  processSummary: function (summary) {
    
  },
  
  ensureTable: function (tab, study) {
    var self = this;

    var theTable = $('.' + study.protocol.category + ' .jtox-study-table')[0];
    if (!theTable) {

      var colDefs = [
        { "mData": "index", "mRender": function(data, type, full) { return '#' + data; } } // Number...
      ];
/*        { "sClass" : "middle", "mData": "parameters", "sDefaultContent": "-" }, // Parameters columns
        { "sClass" : "middle", "mData": "parameters.Sex", "sDefaultContent": "-"},      
        { "sClass": "jtox-multi", "mData": "effects", "mRender": function (data, type, full) { return self.renderMulti(data, type, full, "endpoint");  } },   // Effects columns
        { "sClass": "jtox-multi", "mData" : "effects", "mRender": function (data, type, full) { return self.renderMulti(data, type, full, self.formatResult)} },
        { "sClass": "center", "mData": "protocol.guidance", "mRender" : "[,]", "sDefaultContent": "EUCD !!"  },    // Protocol columns
        { "sClass": "center", "mData": null, "sDefaultContent": "1986"  },
        { "sClass": "center", "mData": null, "sDefaultContent": "EU" }, // Owner / UUID
      ];
*/
      // ok, create and add it
      theTable = document.getElementById('jtox-study').cloneNode(true);
      theTable.id = '';
      tab.appendChild(theTable);
      theTable = theTable.getElementsByClassName('jtox-study-table')[0];
  
      // start filling it
      var preheaderRow = theTable.getElementsByClassName('jtox-preheader')[0].firstElementChild.nextElementSibling;
      var headerRow = theTable.getElementsByClassName('jtox-header')[0];

      // push some parameters' columns
      if (study.parameters.length > 0) {
        preheaderRow.setAttribute('colspan', study.parameters.length);
        preheaderRow = preheaderRow.nextElementSibling;
        
        for (var p in study.parameters) {
          colDefs.push({ "sClass" : "middle", "mData" : "parameters." + p, "sDefaultContent": "-"});
          var th = document.createElement('th');
          th.innerHTML = p;
          headerRow.appendChild(th);
        }
      }
      else { // no parameters? Need to delete some preheader row
        var next = preheaderRow.nextElementSibling;
        preheaderRow.parentNode.removeChild(preheaderRow);
        preheaderRow = next;
      }
      
      // now come the effect/conditions group
      for (var c in study.effects[0].conditions) {
        colDefs.push({ "sClass" : "middle", 
                       "mData" : "effects", 
                       "sDefaultContent": "-", 
                       "mRender" : function(data, type, full) { return self.renderMulti(data, type, full, function(data, type) { return data[c]; } )} 
                    });
        var th = document.createElement('th');
        th.innerHTML = c;
        headerRow.appendChild(th);
      }
      
      // add also the "default" effects columns
      colDefs.push(
        { "sClass": "jtox-multi", "mData": "effects", "mRender": function (data, type, full) { return self.renderMulti(data, type, full, "endpoint");  } },   // Effects columns
        { "sClass": "jtox-multi", "mData" : "effects", "mRender": function (data, type, full) { return self.renderMulti(data, type, full, self.formatResult) } }
      );
      // finally - reflect it on colspan of the preheader.
      preheaderRow.setAttribute('colspan', study.effects[0].conditions.length + 2);
      preheaderRow = preheaderRow.nextElementSibling;
      
      // finally put the protocol entries
      colDefs.push(
        { "sClass": "center", "mData": "protocol.guidance", "mRender" : "[,]", "sDefaultContent": "?"  },    // Protocol columns
        { "sClass": "center", "mData": "uuid", "sDefaultContent": "?" }
      );
      
      // READYY! Go and prepare THE table.
      $(theTable).dataTable( {
        "bPaginate": true,
        "aoColumns": colDefs,
      });
    }
    else
      $(theTable).dataTable().fnClearTable();
      
    return theTable;
  },
  
  processStudies: function (tab, study) {
    var self = this;
    
    for (var i = 0, slen = study.length; i < slen; ++i) {
      var theTable = self.ensureTable(tab, study[i]);
      
      // need to proprocess to insert a number...
      for (var j = 0, jlen = study[i].length; j < jlen; ++j)
        study[i][j]['index'] = j;
      $(theTable).dataTable().fnAddData(study[i]);
      
      // we need to fix columns of
      $('#' + theTable.id + ' .jtox-multi').each(function(index){
        this.style.height = '' + this.offsetHeight + 'px';
      });
    }
  },
};


$(document).ready(function(){
  $('#jtox-studies').tabs();
  jToxStudy.processStudies(document.getElementById('jtox-pchem'), toxStudies.study);
});


