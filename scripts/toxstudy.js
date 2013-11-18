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
      df += '<tr><td style="height: ' + height + '%">' + self.getFormatted(data[i], type, format) + '</td></tr>';
    }
    
    df += '</table>'
    return df;
  },
  
  formatResult: function (data, type) {
    return "" + data.result.loValue + data.result.unit;
  },
  
  processStudies: function (tab, study) {
    var self = this;
    var theTable = tab.getElementsByClassName('jtox-study-table')[0];
    
    $(theTable).dataTable( {
      "bPaginate": true,
      "aoColumns": [
          { "mData": "protocol.endpoint", "sDefaultContent": "#1" },
          { "sClass" : "middle", "mData": "parameters.Species", "sDefaultContent": "-" },
          { "sClass" : "middle", "mData": "parameters.Sex", "sDefaultContent": "-"},
          { "sClass": "jtox-multi", "mData": "effects", "mRender": function (data, type, full) { return self.renderMulti(data, type, full, "endpoint");  } },
          { "sClass": "jtox-multi", "mData" : "effects", "mRender": function (data, type, full) { return self.renderMulti(data, type, full, self.formatResult)} },
          { "sClass": "center", "mData": "protocol.guidance", "mRender" : "[,]", "sDefaultContent": "EUCD !!"  },
          { "sClass": "center", "mData": null, "sDefaultContent": "1986"  },
          { "sClass": "center", "mData": null, "sDefaultContent": "EU"},
      ]
    });
    
    $(theTable).dataTable().fnAddData(study.study);
    $('.jtox-multi').each(function(index){
      this.style.height = '' + this.offsetHeight + 'px';
    });
  },
};


$(document).ready(function(){
  $('#jtox-studies').tabs();
  jToxStudy.processStudies(document.getElementById('jtox-pchem'), toxStudies);
});


