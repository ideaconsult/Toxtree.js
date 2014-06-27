var tt = {
  browserKit: null,
  modelKit: null,
  featuresList: null,
  compoundIdx: 0,
  coreFeatures: [
    "http://www.opentox.org/api/1.1#CASRN", 
    "http://www.opentox.org/api/1.1#EINECS",
    "http://www.opentox.org/api/1.1#IUCLID5_UUID",
    "http://www.opentox.org/api/1.1#ChemicalName",
/*
    "http://www.opentox.org/api/1.1#TradeName",
    "http://www.opentox.org/api/1.1#IUPACName",
*/
    "http://www.opentox.org/api/1.1#SMILES",
    "http://www.opentox.org/api/1.1#InChIKey",
    "http://www.opentox.org/api/1.1#InChI",
    "http://www.opentox.org/api/1.1#REACHRegistrationDate"
  ]
};

var config_toxtree = {
	"handlers": {
  	"query": function (e, query) {
  	  clearSlate();
      query.query();  
    },
    "checked": function (e, query) {
      // TODO: initiate the single compound browser to work on selected only
    },
    "markAuto": function (e) {
      $(this).toggleClass('active');
      onSelectedUpdate(e);
      e.stopPropagation();
    },
    "makeModel": makeModel,
    "runPredict": function (e) { runPredict.call(this, e); }
	}
};

function makeModel(e, callback) {
  var tEl = $(this).parents('.title')[0];
  var uri = $('a', tEl)[0].href;
  $(this).addClass('loading');
  var el = this;
  tt.modelKit.getModel(uri, function (result) {
    if (!!result) {
      $(el).addClass('active');
      $(tEl).data('model', result);
    }
    $(el).removeClass('loading');
    ccLib.fireCallback(callback, this, result);
  });
  
  if (e != null)
    e.stopPropagation();
}

function runPredict (e, index, callback) {
  var el = this;
  if (index == null)
    index = tt.compoundIdx;
  
  if (tt.browserKit.dataset == null || index < 0 || index >= tt.browserKit.dataset.dataEntry.length)
    return;

  var tEl = $(this).parents('.title')[0];
  var runIt = function (modelUri) {
    tt.modelKit.runPrediction(tt.browserKit.dataset.dataEntry[index].compound.URI, modelUri, function (result) {
      if (!!result) {
        if (index == tt.compoundIdx)
          showPrediction(result, $('a', tEl)[0].href);
        $(el).addClass('active');
      }
      $(el).removeClass('loading');
      ccLib.fireCallback(callback, this, result);
    })
  };
  
  $(this).addClass('loading');
  if ($(tEl).data('model') == null) {
    makeModel.call(el.nextElementSibling, null, function (result) { 
      if (!!result)
        runIt(result);
    });
  }
  else
    runIt($(tEl).data('model'));
  
  if (e != null)
    e.stopPropagation();
}

function runSelected() {
  $('#tt-models-panel button.tt-toggle.auto.active').each(function () {
    var el = $('button.tt-toggle.predict', $(this).parent()[0])[0];
    runPredict.call(el, null);
  });  
}

function formatAlgoName(val) {
  return (val.indexOf('ToxTree: ') == 0) ? val = val.substr(9) : val;
}

function onSelectedUpdate(e) {
	var tEl = $('#tt-models-panel .title')[0];
	var v = $('button.tt-toggle.auto.active', tt.modelKit.rootElement).length;
	tEl.innerHTML = jT.ui.updateCounter(tEl.innerHTML, v, tt.modelKit.algorithm.length);;
}

function onAlgoLoaded(result) {
  $(tt.modelKit.rootElement).empty();
  ccLib.populateData(tt.modelKit.rootElement, '#tt-algorithm', result.algorithm);
  onSelectedUpdate(null);
}

function resizeFeatures(e) {
  var timer = null;
  if (timer != null)
    clearTimeout(timer);
  var timer = setTimeout(function () {
    var bigpane = $('#tt-bigpane')[0];
    $(bigpane).height(document.body.offsetHeight - bigpane.offsetTop);

    var listpane = $('#tt-features .list')[0];
    $(listpane).height($(bigpane).height() - $('#tt-diagram').height() - listpane.offsetTop - 30); // 30 comes from padding + border styling...
  }, 100);
}

function addFeatures(data, className) {
  if (data.length > 0) {
    var enumFn = null;
    if (className != null) {
      enumFn = function () { $(this).addClass(className); };
      $('.' + className, tt.featuresList).remove();
    }
    ccLib.populateData(tt.featuresList, '#tt-feature', data, enumFn);
    var sep = $('#tt-feature')[0].cloneNode(true);
    sep.removeAttribute('id');
    $(sep).addClass('separator').empty();
    if (className != null)
      $(sep).addClass(className);
    tt.featuresList.appendChild(sep);
  }
}

function clearSlate() {
  $(tt.featuresList).empty();
  $('#tt-diagram img.toxtree-diagram')[0].src = '';
  resizeFeatures(null);
  $('#tt-models-panel .tt-algorithm button.predict').removeClass('active');
  $('#tt-models-panel .tt-algorithm .content .tt-explanation').empty();
}

function changeImage(part, path) {
  
  $('#tt-diagram img.toxtree-diagram')[0].src = tt.browserKit.dataset.dataEntry[tt.compoundIdx].compound.URI + path + '&media=image/png';
  resizeFeatures(null);    
}

function showCompound() {
  var kit = tt.browserKit;

  if (kit.dataset.dataEntry[tt.compoundIdx] != null) {
    $('#tt-diagram img.toxtree-diagram')[0].src = kit.dataset.dataEntry[tt.compoundIdx].compound.diagramUri;
    resizeFeatures();
  }

  var counter = $('#tt-browser-panel .counter-field')[0];
  counter.innerHTML = jT.ui.updateCounter(
    counter.innerHTML, 
    tt.compoundIdx + kit.pageStart + (kit.dataset.dataEntry[tt.compoundIdx] ? 1 : 0), 
    kit.entriesCount != null ? kit.entriesCount : kit.pageStart + kit.pageSize + '+'
  );
  
  if (tt.compoundIdx == 0 && kit.pageStart == 0) // we need to disable prev 
    $('#tt-browser-panel .prev-field').addClass('paginate_disabled_previous').removeClass('paginate_enabled_previous');
  else
    $('#tt-browser-panel .prev-field').removeClass('paginate_disabled_previous').addClass('paginate_enabled_previous');
    
  if (kit.entriesCount != null && tt.compoundIdx + kit.pageStart >= kit.entriesCount - 1)
    $('#tt-browser-panel .next-field').addClass('paginate_disabled_next').removeClass('paginate_enabled_next');
  else
    $('#tt-browser-panel .next-field').removeClass('paginate_disabled_next').addClass('paginate_enabled_next');

  var entry = tt.browserKit.dataset.dataEntry[tt.compoundIdx];
  if (entry != null)
    addFeatures(tt.browserKit.featureData(entry, tt.coreFeatures));
}

function showPrediction(result, algoUri) {
  for (var idx = 0, al = tt.modelKit.algorithm.length; idx < al; ++idx) {
    if (tt.modelKit.algorithm[idx].uri == algoUri)
      break;    
  }
  var explanation = null;
  var data = jToxCompound.extractFeatures(result.dataEntry[0], result.feature, function (entry, feature, fId) {
    if (entry.title.indexOf("#explanation") > -1)
      explanation = entry.value;
    else if (!!entry.value) {
      return true;
    }
    return false;
  });
  
  addFeatures(data, tt.modelKit.algorithm[idx].id);
  var aEl = $('#tt-models-panel div.tt-algorithm:nth-child(' + (idx + 1) + ')')[0];
  if (explanation != null)
    $('.tt-explanation', aEl).html(explanation.replace(/(\W)(Yes|No)(\W)/g, '$1<span class="answer $2">$2</span>$3'));
  $(aEl).removeClass('folded');
}

function loadCompound(index) {
  if (index < 0 && tt.browserKit.pageStart > 0) { // we might need a reload...
    tt.compoundIdx = tt.browserKit.pageSize - 1;
    tt.browserKit.prevPage();
  }
  else if (index >= tt.browserKit.dataset.dataEntry.length) {
    tt.compoundIdx = 0;
    tt.browserKit.nextPage();
  }
  else if (index != tt.compoundIdx) { // normal showing up
    tt.compoundIdx = index;
    clearSlate();
    showCompound();
  }
}

function switchView(mode) {
  if (typeof mode != 'string')
    mode = $(this).data('mode');
  $('#sidebar .side-title>div').each(function () {
    if ($(this).data('mode') == mode)
      $(this).addClass("pressed");
    else
      $(this).removeClass("pressed");
  });
  
  var scroller = $('#tt-bigpane')[0];
  $(scroller).animate({ scrollTop: (mode == 'single') ? 0 : $('#tt-table')[0].offsetTop }, 300, 'easeOutQuad');
}

function onTableDetails(idx) {
  loadCompound(idx);
  switchView('single');
  return false;  
}

$(document).ready(function(){
  $('#tt-models-panel a.select-all').on('click', function () {
    $('#tt-models-panel button.tt-toggle.auto').addClass('active');
    onSelectedUpdate.call(this);
  });
  $('#tt-models-panel a.unselect-all').on('click', function () {
    $('#tt-models-panel button.tt-toggle.auto').removeClass('active');
    onSelectedUpdate.call(this);
  });
  $('#tt-models-panel a.run-selected').on('click', function () {
    runSelected();
  });
  $('#tt-models-panel a.show-hide').on('click', function () {
    var alt = $(this).data('other');
    $(this).data('other', this.innerHTML);
    this.innerHTML = alt;
    var set = $('#tt-models-panel button.tt-toggle.auto.active').parents('.tt-algorithm');
    if (alt == 'show')
      set.hide();
    else {
      set.show();
      $('#tt-models-panel button.tt-toggle.auto').parents('.tt-algorithm:hidden').show();
    }
  });
  
  tt.browserKit = jToxCompound.kits[0];
  tt.modelKit = jToxModel.kits[0];
  tt.featuresList = $('#tt-features .list')[0];
  
  $('#tt-browser-panel .prev-field').on('click', function () { if ($(this).hasClass('paginate_enabled_previous')) loadCompound(tt.compoundIdx - 1); });
  $('#tt-browser-panel .next-field').on('click', function () { if ($(this).hasClass('paginate_enabled_next')) loadCompound(tt.compoundIdx + 1); });
  $('#tt-diagram .title').on('click', resizeFeatures);
  $('#sidebar .side-title>div').on('click', switchView);
  switchView('single');
  
  $(window).on('resize', resizeFeatures);
  resizeFeatures(null);
});
