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
  
  ensureCategory: function(tab, category, name, count) {
    var self = this;

    var theCat = $('.' + category + ' .jtox-study-table')[0];
    if (!theCat) {
      theCat = document.getElementById('jtox-study').cloneNode(true);
      theCat.removeAttribute('id');
      tab.appendChild(theCat);
      $(theCat).addClass(category);
    }
    
    var titleEl = theCat.getElementsByClassName('jtox-study-title')[0];
    titleEl.innerHTML = name + " (" + count + ")";
    return theCat;
  },
  
  ensureTable: function (tab, study) {
    var self = this;

    var theTable = $('.' + study.protocol.category + ' .jtox-study-table')[0];
    if (!$(theTable).hasClass('dataTable')) {

      var colDefs = [
        { "sClass": "middle", "mData": "index", "mRender": function(data, type, full) { return '#' + data; } } // Number...
      ];
      
      // start filling it
      var headerRow = theTable.getElementsByClassName('jtox-header')[0];
      var before = headerRow.firstElementChild;
      var parCount = 0;

      // this function takes care to add as columns all elements from given array
      var putAGroup = function(group, fProcess) {
        for (var p in group) {
          colDefs.push(fProcess(p));
          
          var th = document.createElement('th');
          th.innerHTML = p;
          headerRow.insertBefore(th, before);
          before = th.nextElementSibling;
          parCount++;
        }
      }

      // use it to put parameters...
      putAGroup(study.parameters, function(p) {
        return { "sClass" : "middle", "mData" : "parameters." + p, "sDefaultContent": "-"};
      });
      // .. and conditions
      putAGroup(study.effects[0].conditions, function(c){
        return { "sClass" : "middle jtox-multi", 
                 "mData" : "effects", 
                 "sDefaultContent": "-", 
                 "mRender" : function(data, type, full) { return self.renderMulti(data, type, full, function(data, type) { return data.conditions[c]; } )} 
              };
      });
      
      // now fix the colspan of 'Conditions' preheader cell
      var preheaderCell = theTable.getElementsByClassName('jtox-preheader')[0].firstElementChild.nextElementSibling;
      if (parCount > 0)
        preheaderCell.setAttribute('colspan', parCount);
      else
        preheaderCell.parentNode.removeChild(preheaderCell);
      
      // add also the "default" effects columns
      colDefs.push(
        { "sClass": "middle jtox-multi", "mData": "effects", "mRender": function (data, type, full) { return self.renderMulti(data, type, full, "endpoint");  } },   // Effects columns
        { "sClass": "middle jtox-multi", "mData" : "effects", "mRender": function (data, type, full) { return self.renderMulti(data, type, full, self.formatResult) } }
      );
      
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
  
  processSummary: function (summary) {
    
  },
  
  processStudies: function (tab, study) {
    var self = this;
    var cats = [];
    
    // first swipe to map them to different categories...
    for (var i = 0, slen = study.length; i < slen; ++i) {
      var ones = study[i];
      if (cats[ones.protocol.category] === undefined) {
        ones['index'] = 1;
        cats[ones.protocol.category] = { "name": ones.protocol.endpoint, "array" : [ones]};
      }
      else {
        ones['index'] = cats[ones.protocol.category].array.length + 1;
        cats[ones.protocol.category].array.push(ones);
      }
    }
    
    // now iterate within
    for (var c in cats) {
      var onec = cats[c];
      self.ensureCategory(tab, c, onec.name, onec.array.length);
      var theTable = self.ensureTable(tab, onec.array[0]);
      $(theTable).dataTable().fnAddData(onec.array);
    }
    
    // we need to fix columns of
    $('#' + theTable.id + ' .jtox-multi').each(function(index){
      this.style.height = '' + this.offsetHeight + 'px';
    });
  },
};


$(document).ready(function(){
  $('#jtox-studies').tabs();
  jToxStudy.processStudies(document.getElementById('jtox-pchem'), toxStudies.study);
});


