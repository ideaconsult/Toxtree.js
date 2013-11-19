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
  
  ensureCategory: function(tab, category, name) {
    var self = this;

    var theCat = $('.' + category + ' .jtox-study-table')[0];
    if (!theCat) {
      theCat = jToxKit.getTemplate('#jtox-study');
      tab.appendChild(theCat);
      $(theCat).addClass(category);
      
      // install the click handler for fold / unfold
      theCat.onclick = function(e) {
        $(this).toggleClass('folded');
      };
      
      // now install the filter box handler. It delays the query a bit and then spaws is to all tables in the tab.
      var filterTimeout = null;
      var fFilter = function (ev) {
        if (!!filterTimeout)
          clearTimeout(filterTimeout);

        var field = ev.currentTarget;
        filterTimeout = setTimeout(function() {
          var tabList = tab.getElementsByClassName('jtox-study-table');
          for (var t = 0, tlen = tabList.length; t < tlen; ++t) {
            $(tabList[t]).dataTable().fnFilter(field.value);
          }
        }, 300);
      };
      
      var filterEl = tab.getElementsByClassName('jtox-study-filter')[0];
      filterEl.onkeydown = fFilter;
    }
    
    var titleEl = theCat.getElementsByClassName('jtox-study-title')[0];
    titleEl.innerHTML = name + " (0)";
    return theCat;
  },
  
  ensureTable: function (tab, study) {
    var self = this;

    var theTable = $('.' + study.protocol.category + ' .jtox-study-table')[0];
    if (!$(theTable).hasClass('dataTable')) {

      var colDefs = [
        { "sClass": "center middle", "bSearchable": false, "mData": "index", "mRender": function(data, type, full) { return '#' + data; } } // Number...
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
        return { "sClass" : "center middle", "mData" : "parameters." + p, "sDefaultContent": "-"};
      });
      // .. and conditions
      putAGroup(study.effects[0].conditions, function(c){
        return { "sClass" : "center middle jtox-multi", 
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
        { "sClass": "center middle jtox-multi", "mData": "effects", "mRender": function (data, type, full) { return self.renderMulti(data, type, full, "endpoint");  } },   // Effects columns
        { "sClass": "center middle jtox-multi", "mData" : "effects", "mRender": function (data, type, full) { return self.renderMulti(data, type, full, self.formatResult) } }
      );
      
      // finally put the protocol entries
      colDefs.push(
        { "sClass": "center", "mData": "protocol.guidance", "mRender" : "[,]", "sDefaultContent": "?"  },    // Protocol columns
        { "sClass": "center", "mData": "uuid", "bSearchable": false, "sDefaultContent": "?" }
      );
      
      // READYY! Go and prepare THE table.
      $(theTable).dataTable( {
        "bPaginate": true,
        "aoColumns": colDefs,
        "sDom" : "rt<Fip>",
        "fnInfoCallback": function( oSettings, iStart, iEnd, iMax, iTotal, sPre ) {
          var el = $('.jtox-study-title', $(this).parentsUntil('.jtox-study')[0].parentNode)[0];
          var str = el.innerHTML;
          el.innerHTML = str.replace(/(.+)\s\(([0-9]+)\)/, "$1 (" + iTotal + ")");
          return sPre;
        }
      });
    }
    else
      $(theTable).dataTable().fnClearTable();
      
    return theTable;
  },
  
  processSummary: function (summary) {
    for (var s in summary) {
      var sum = summary[s];
      
    }  
  },
  
  processStudies: function (tab, study, map) {
    var self = this;
    var cats = [];
    
    // first swipe to map them to different categories...
    for (var i = 0, slen = study.length; i < slen; ++i) {
      var ones = study[i];
      if (map) {
        if (cats[ones.protocol.category] === undefined) {
          ones['index'] = 1;
          cats[ones.protocol.category] = { "name": ones.protocol.category, "array" : [ones]};
        }
        else {
          ones['index'] = cats[ones.protocol.category].array.length + 1;
          cats[ones.protocol.category].array.push(ones);
        }
      }
      else  // i.e. - don't remap - just add the index
        ones['index'] = i + 1;
    }

    // add this one, if we're not remapping. map == false assumes that all passed studies will be from
    // one category.    
    if (!map)
      cats[study[0].protocol.category] = { "name" : study[0].protocol.endpoint, "array" : study };
    
    // now iterate within
    for (var c in cats) {
      var onec = cats[c];
      self.ensureCategory(tab, c, onec.name);
      var theTable = self.ensureTable(tab, onec.array[0]);
      $(theTable).dataTable().fnAddData(onec.array);
    }
    
    // we need to fix columns height's because of multi-cells
    $('#' + theTable.id + ' .jtox-multi').each(function(index){
      this.style.height = '' + this.offsetHeight + 'px';
    });
  },
  
  init: function(root, settings) {
    var tree = jToxKit.getTemplate('#jtox-studies');
    root.appendChild(tree);
    $(tree).tabs();
    
    this.processStudies(document.getElementById('jtox-pchem'), toxStudies.study, true);
  }
};
