var jToxStudy = {
  summaryURI: "http://apps.ideaconsult.net:8080/biodeg/substance/<1>/studysummary?media=application/json",
  rootElement: null,
  
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
    var out = "";
    data = data.result;
    if (data.loValue !== undefined && data.upValue !== undefined) {
      out += (data.loQualifier == ">=") ? "[" : "(";
      out += data.loValue + ", " + data.upValue;
      out += (data.upQualifier == "<=") ? "]" : ") ";
    }
    else // either of them is non-undefined
    {
      var fnFormat = function (q, v) {
        return ((q !== undefined) ? q : "=") + " " + v;
      };
      
      out += (data.loValue !== undefined) ? fnFormat(data.loQualifier, data.loValue) : fnFormat(data.upQualifier, data.upValue);
    }
    
    if (!!data.unit)
      out += data.unit;
    return out.replace(/ /g, "&nbsp;");
  },
  
  createCategory: function(tab, category, name) {
    var self = this;

    var theCat = $('.' + category + '.jtox-study', tab)[0];
    if (!theCat) {
      theCat = jToxKit.getTemplate('#jtox-study');
      tab.appendChild(theCat);
      $(theCat).addClass(category);
      
      // install the click handler for fold / unfold
      var titleEl = $('.jtox-study-title', theCat);
      $(titleEl).click(function() {
        $(theCat).toggleClass('folded');
      });
    }
    
    jToxKit.fillTree(titleEl[0], { title: "" + name + " (0)"});
    return theCat;
  },

  updateCount: function(str, count) {
    if (count === undefined)
      count = 0;
    return str.replace(/(.+)\s\(([0-9]+)\)/, "$1 (" + count + ")");
  },
  
  
  ensureTable: function (tab, study) {
    var self = this;

    var theTable = $('.' + study.protocol.category + ' .jtox-study-table')[0];
    if (!$(theTable).hasClass('dataTable')) {

      var colDefs = [
        { "sClass": "center", "sWidth": "125px", "mData": "protocol.endpoint" } // The name (endpoint)
      ];
      
      // start filling it
      var headerRow = theTable.getElementsByClassName('jtox-header')[0];
      var before = headerRow.firstElementChild;
      var parCount = 0;

      // this function takes care to add as columns all elements from given array
      var putAGroup = function(group, fProcess) {
        var count = 0;
        for (var p in group) {
          var val = fProcess(p);
          if (val === undefined)
            continue;
          colDefs.push(val);
          
          var th = document.createElement('th');
          th.innerHTML = p;
          headerRow.insertBefore(th, before);
          before = th.nextElementSibling;
          count++;
        }
        return count;
      }

      // use it to put parameters...
      parCount += putAGroup(study.parameters, function(p) {
        return study.effects[0].conditions[p] === undefined  && study.effects[0].conditions[p + " unit"] === undefined ? 
        { 
          "sClass" : "center middle", 
          "mData" : "parameters." + p, 
          "mRender" : function (data, type, full) { return data !== undefined ? (data + ((full[p + " unit"] !== undefined) ? "&nbsp;" + full[p + " unit"] : "")) : "-"; }
        } : undefined;
      });
      // .. and conditions
      parCount += putAGroup(study.effects[0].conditions, function(c){
        return study.effects[0].conditions[c + " unit"] === undefined ?
        { "sClass" : "center middle jtox-multi", 
          "mData" : "effects", 
          "mRender" : function(data, type, full) { return self.renderMulti(data, type, full, function(data, type) { return data.conditions[c] !== undefined ? (data.conditions[c] + (data.conditions[c + " unit"] !== undefined ? "&nbsp;" + data.conditions[c + " unit"] : "")) : "-"; } )} 
        } : undefined;
      });
      
      // now fix the colspan of 'Conditions' preheader cell
      var preheaderCell = theTable.getElementsByClassName('jtox-preheader')[0].firstElementChild.nextElementSibling;
      if (parCount > 0)
        preheaderCell.setAttribute('colspan', parCount);
      else
        preheaderCell.parentNode.removeChild(preheaderCell);
      
      // add also the "default" effects columns
      colDefs.push(
        { "sClass": "center middle jtox-multi", "sWidth": "50px", "mData": "effects", "mRender": function (data, type, full) { return self.renderMulti(data, type, full, "endpoint");  } },   // Effects columns
        { "sClass": "center middle jtox-multi", "mData" : "effects", "mRender": function (data, type, full) { return self.renderMulti(data, type, full, self.formatResult) } }
      );

      // jump over those two - they are already in the DOM      
      before = before.nextElementSibling.nextElementSibling;
      
      // now is time to put interpretation columns..
      parCount = putAGroup(study.interpretation, function(i){
        return { "sClass" : "center middle jtox-multi", "mData" : "interpretation." + i, "sDefaultContent": "-"};
      });

      // jump over Effects preheader-column      
      preheaderCell = preheaderCell.nextElementSibling.nextElementSibling;
      if (parCount > 0)
        preheaderCell.setAttribute('colspan', parCount);
      else
        preheaderCell.parentNode.removeChild(preheaderCell);
      
      // finally put the protocol entries
      colDefs.push(
        { "sClass": "center", "sWidth": "125px", "mData": "protocol.guidance", "mRender" : "[,]", "sDefaultContent": "?"  },    // Protocol columns
        { "sClass": "center", "sWidth": "75px", "mData": "owner.company.name", "mRender" : function(data, type, full) { return type != "display" ? '' + data : '<div class="shortened">' + data + '</div>' }  }, 
        { "sClass": "center", "sWidth": "75px", "mData": "uuid", "bSearchable": false, "mRender" : function(data, type, full) { return type != "display" ? '' + data : '<div class="shortened">' + data + '</div>' }  }
      );
      
      // READYY! Go and prepare THE table.
      $(theTable).dataTable( {
        "bPaginate": true,
        "bProcessing": true,
        "bLengthChange": false,
//        "sPaginationType": "full_numbers",
        "sDom" : "rt<Fip>",
        "aoColumns": colDefs,
        "fnInfoCallback": function( oSettings, iStart, iEnd, iMax, iTotal, sPre ) {
          var el = $('.jtox-study-title .data-field', $(this).parentsUntil('.jtox-study').parent())[0];
          el.innerHTML = self.updateCount(el.innerHTML, iTotal);
          return sPre;
        }
      });
    }
    else
      $(theTable).dataTable().fnClearTable();
      
    return theTable;
  },
  
  processSummary: function (summary) {
    var self = this;
    var typeSummary = [];
    
    // first - clear all existing tabs
    var catList = self.rootElement.getElementsByClassName('jtox-study');
    for (var i = 0,clen = catList.length; i < clen; ++i){
      catList[i].parentNode.removeChild(catList[i]);
    }
    
    // create the groups on the corresponding tabs
    for (var s in summary) {
      var sum = summary[s];
      var top = sum.topcategory.title;
      if (!top)
        continue;
      var top = top.replace(/ /g, "_");
      var tab = $('.jtox-study-tab.' + top, self.rootElement)[0];
      
      var catname = sum.category.title;
      if (!catname) {
        typeSummary[top] = sum.count;
      }
      else {
        var cat = self.createCategory(tab, catname, catname);
        $(cat).data('jtox-uri', sum.category.uri);
      }
    }
    
    // update the number in the tabs...
    $('ul li a', self.rootElement).each(function (i){
      var data = $(this).data('type');
      if (!!data){
        var cnt = typeSummary[data];
        var el = $(this)[0];
        el.innerHTML = (self.updateCount(el.innerHTML, cnt));
      }
    });
    
    // now install the filter box handler. It delays the query a bit and then spaws is to all tables in the tab.
    var filterTimeout = null;
    var fFilter = function (ev) {
      if (!!filterTimeout)
        clearTimeout(filterTimeout);
  
      var field = ev.currentTarget;
      var tab = $(this).parentsUntil('.jtox-study-tab')[0].parentNode;
      
      filterTimeout = setTimeout(function() {
        var tabList = tab.getElementsByClassName('jtox-study-table');
        for (var t = 0, tlen = tabList.length; t < tlen; ++t) {
          $(tabList[t]).dataTable().fnFilter(field.value);
        }
      }, 300);
    };
    
    var tabList = document.getElementsByClassName('jtox-study-tab');
    for (var t = 0, tlen = tabList.length;t < tlen; t++){
      var filterEl = tabList[t].getElementsByClassName('jtox-study-filter')[0].onkeydown = fFilter;
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
          cats[ones.protocol.category] = [ones];
        }
        else {
          cats[ones.protocol.category].push(ones);
        }
      }
    }

    // add this one, if we're not remapping. map == false assumes that all passed studies will be from
    // one category.    
    if (!map)
      cats[study[0].protocol.category] = study;
    
    // now iterate within all categories (if many) and initialize the tables
    for (var c in cats) {
      var onec = cats[c];
      if ($('.' + c + '.jtox-study', tab).length < 1)
        continue;

      var theTable = self.ensureTable(tab, onec[0]);
      $(theTable).dataTable().fnAddData(onec);
    }
    
    // we need to fix columns height's because of multi-cells
    $('#' + theTable.id + ' .jtox-multi').each(function(index){
      this.style.height = '' + this.offsetHeight + 'px';
    });
  },
  
  querySummary: function(substanceURI) {
    var self = this;
    var subId = substanceURI.replace(/.+\/(.+)/, "$1");
    jToxKit.fillTree($('#jtox-composition .data-field', self.rootElement)[0], {substanceID: subId});
    
    jToxKit.call(substanceURI + "/studysummary", function(summary) {
      self.processSummary(summary.facet);
    });
  },
  
  init: function(root, settings) {
    var self = this;
    this.rootElement = root;
    var tree = jToxKit.getTemplate('#jtox-studies');
    root.appendChild(tree);
    $(tree).tabs({
      "beforeActivate" : function(event, ui) {
        if (ui.newPanel){
          $('.jtox-study.unloaded', ui.newPanel[0]).each(function(i){
            var table = this;
            jToxKit.call($(table).data('jtox-uri'), function(study){
              $(table).removeClass('unloaded folded');
              $(table).addClass('loaded');
              self.processStudies(ui.newPanel[0], study.study, true); // TODO: must be changed to 'false', when the real summary is supplied
            });  
          });
        }
      }
    });
    
    if (settings['substance'] !== undefined){
      self.querySummary(settings['substance'] + "/studysummary");
    }
  }
};
