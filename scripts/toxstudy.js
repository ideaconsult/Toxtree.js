var jToxStudy = {
  defaultColumns: [
    { "mData": "protocol.endpoint", "sDefaultContent": "#1" }, // No
    { "sClass" : "middle", "mData": "parameters.Species", "sDefaultContent": "-" }, // Parameters columns
    { "sClass" : "middle", "mData": "parameters.Sex", "sDefaultContent": "-"},      
    { "sClass": "jtox-multi", "mData": "effects", "mRender": function (data, type, full) { return self.renderMulti(data, type, full, "endpoint");  } },   // Effects columns
    { "sClass": "jtox-multi", "mData" : "effects", "mRender": function (data, type, full) { return self.renderMulti(data, type, full, self.formatResult)} },
    { "sClass": "center", "mData": "protocol.guidance", "mRender" : "[,]", "sDefaultContent": "EUCD !!"  },    // Protocol columns
    { "sClass": "center", "mData": null, "sDefaultContent": "1986"  },
    { "sClass": "center", "mData": null, "sDefaultContent": "EU"},
  ],
  
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
  
  processStudies: function (tab, study) {
    var self = this;
    var theTable = tab.getElementsByClassName('jtox-study-table')[0];
    var cols = self.defaultColumns.slice(0);
    
    $(theTable).dataTable( {
      "bPaginate": true,
      "aoColumns": cols,
    });
    
    $(theTable).dataTable().fnAddData(study.study);
    
    // we need to fix columns of
    $('#' + theTable.id + ' .jtox-multi').each(function(index){
      this.style.height = '' + this.offsetHeight + 'px';
    });
  },
};


$(document).ready(function(){
  $('#jtox-studies').tabs();
  jToxStudy.processStudies(document.getElementById('jtox-pchem'), toxStudies);
});


