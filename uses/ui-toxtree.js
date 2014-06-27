var tt = {
  browserKit: null,
  modelKit: null,
  featuresList: null,
  algoMap: {}, // { <id> : { index: <>, results: <>, dom: }
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
  "baseFeatures": {}, // to be expanded upon algorithm loading
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
    "makeModel": function (e) { makeModel(this); e.stopPropagation(); },
    "runPredict": function (e) { runPredict(this); e.stopPropagation(); }
	},
	"groups" : {
	  "Identifiers": [
      "http://www.opentox.org/api/1.1#Diagram",
      "http://www.opentox.org/api/1.1#CASRN", 
      "http://www.opentox.org/api/1.1#EINECS",
      "http://www.opentox.org/api/1.1#IUCLID5_UUID"
	  ],
  	"Names" : null,
  	"Calculated": null,
  	"Other": null,
  	"ToxTree": []   // to be expanded upon algorithm loading
	}
};

function makeModel(el, algoId, callback) {
  if (!el)
    el = $('button.tt-toggle.model', tt.algoMap[algoId].dom)[0];
  else
    algoId = $(el).parents('.tt-algorithm').data('algoId');
  
  var uri = tt.modelKit.algorithm[tt.algoMap[algoId].index].uri;
  $(el).addClass('loading');

  tt.modelKit.getModel(uri, function (result) {
    if (!!result) {
      $(el).addClass('active');
      tt.algoMap[algoId].model = result;
    }
    $(el).removeClass('loading');
    ccLib.fireCallback(callback, null, result);
  });
}

function runPredict (el, algoId, all) {
  if (!el)
    el = $('button.tt-toggle.predict', tt.algoMap[algoId].dom)[0];
  else {
    algoId = $(el).data('algoId');
    if (algoId == null) 
      algoId = $(el).parents('.tt-algorithm').data('algoId');
  }

  var datasetUri = null;
  var index = null;
  if (all)
    datasetUri = tt.browserKit.queryUri();
  else {
    index = $(el).data('index');
    if (index == null)
      index = tt.compoundIdx;
    if (index >= 0 && index < tt.browserKit.dataset.dataEntry.length)
      datasetUri = tt.browserKit.dataset.dataEntry[index].compound.URI;  
  }
  
  if (tt.browserKit.dataset == null || datasetUri == null)
    return;

  var runIt = function (modelUri) {
    tt.modelKit.runPrediction(datasetUri, modelUri, function (result) {
      if (!!result) {
        showPrediction(result, algoId, all);
        $(el).addClass('active');
      }
      $(el).removeClass('loading');
    })
  };
  
  $(el).addClass('loading');
  if (tt.algoMap[algoId].model == null) {
    makeModel(null, algoId, function (result) { 
      if (!!result)
        runIt(result);
    });
  }
  else
    runIt(tt.algoMap[algoId].model);
}

function runSelected() {
  $('#tt-models-panel button.tt-toggle.auto.active').each(function () {
    var tEl = $(this).parents('.tt-algorithm');
    runPredict(null, tEl.data('algoId'), true);
  });  
}

function formatAlgoName(val) {
  return (val.indexOf('ToxTree: ') == 0) ? val = val.substr(9) : val;
}
function formatPrediction(val) {
  return val != null ? val :'-';  
}

function onSelectedUpdate(e) {
	var tEl = $('#tt-models-panel .title')[0];
	var v = $('button.tt-toggle.auto.active', tt.modelKit.rootElement).length;
	tEl.innerHTML = jT.ui.updateCounter(tEl.innerHTML, v, tt.modelKit.algorithm.length);;
}

function onDataLoaded(result) {
  showCompound();
  runSelected();
}

function onAlgoLoaded(result) {
  $(tt.modelKit.rootElement).empty();
  var idx = 0;
  ccLib.populateData(tt.modelKit.rootElement, '#tt-algorithm', result.algorithm, function (data) {
    tt.algoMap[data.id] = { 
      index: idx,
      dom: this,
      results: {},
    };
    
    $(this).data('algoId', data.id);
    config_toxtree.groups.ToxTree.push(data.uri);
    config_toxtree.baseFeatures[data.uri] = {
  	  title: formatAlgoName(data.name), 
  	  search: false,
  	  data: "index",
  	  column: { sClass: data.id },
  	  render: (function (aId) { return function(data, type, full) {
  	    return (type != 'display') ? data : 
  	    '<div class="tt-prediction">' +
  	      '<button class="tt-toggle jtox-handler predict" data-algo-id="' + aId + '" data-index="' + data + '" data-handler="runPredict" title="Run prediction with the algorithm on current compound">▶︎</button>' +
  	     '</div>';
        };
      })(data.id)
    };
    idx++;
  });
  
  onSelectedUpdate(null);
  // not it's time to create the browser table
  jT.initKit($('#tt-table')[0]);
  tt.browserKit = jToxCompound.kits[0];
}

var updateTimer = null;
function updateSize(root) {
  if (typeof root == 'string')
    root = $(root)[0];
  if (updateTimer != null)
    clearTimeout(updateTimer);
  updateTimer = setTimeout(function () { ccLib.flexSize(root); }, 100);
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
  updateSize();
  $('#tt-models-panel .tt-algorithm button.predict').removeClass('active');
  $('#tt-models-panel .tt-algorithm .content .tt-explanation').empty();
}

function changeImage(part, path) {
  $('#tt-diagram img.toxtree-diagram')[0].src = tt.browserKit.dataset.dataEntry[tt.compoundIdx].compound.URI + path + '&media=image/png';
  updateSize('#tt-browser-panel');
}

function showCompound() {
  var kit = tt.browserKit;

  if (kit.dataset.dataEntry[tt.compoundIdx] != null) {
    $('#tt-diagram img.toxtree-diagram')[0].src = kit.dataset.dataEntry[tt.compoundIdx].compound.diagramUri;
    updateSize('#tt-browser-panel');
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

function showPrediction(result, algoId, all) {
  var explanation = null;
  for (var i = 0, rl = result.dataEntry.length; i < rl; ++i) {
    var compound = result.dataEntry[i];
    
    if (!all || i == tt.compoundIdx) {
      var data = jToxCompound.extractFeatures(compound, result.feature, function (entry, feature, fId) {
        if (entry.title.indexOf("#explanation") > -1)
          explanation = entry.value;
        else if (!!entry.value) {
          return true;
        }
        return false;
      });
      addFeatures(data, algoId);
      var aEl = tt.algoMap[algoId].dom;
      if (explanation != null)
        $('.tt-explanation', aEl).html(explanation.replace(/(\W)(Yes|No)(\W)/g, '$1<span class="answer $2">$2</span>$3'));
      $(aEl).removeClass('folded');
    }
  }
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
  $('#tt-models-panel a.select-unselect').on('click', function () {
    var alt = $(this).data('other');
    $(this).data('other', this.innerHTML);
    this.innerHTML = alt;
    if (alt != 'select')
      $('#tt-models-panel button.tt-toggle.auto').addClass('active');
    else
      $('#tt-models-panel button.tt-toggle.auto.active').removeClass('active');
    
    onSelectedUpdate.call(this);
  });
  $('#tt-models-panel a.expand-collapse').on('click', function () {
    var alt = $(this).data('other');
    $(this).data('other', this.innerHTML);
    this.innerHTML = alt;
    if (alt != 'collapse')
      $('#tt-models-panel .tt-algorithm').addClass('folded');
    else
      $('#tt-models-panel .tt-algorithm.folded').removeClass('folded');
  });
  $('#tt-models-panel a.run-selected').on('click', function () {
    runSelected();
  });
  $('#tt-models-panel a.show-hide').on('click', function () {
    var alt = $(this).data('other');
    if ($('#tt-models-panel button.tt-toggle.auto.active').length == 0 && alt != 'hide')
      return;
    $(this).data('other', this.innerHTML);
    this.innerHTML = alt;
    $('#tt-models-panel button.tt-toggle.auto').each(function () {
      var par = $(this).parents('.tt-algorithm');
      var aId = $(par).data('algoId');
      if (alt != 'show'){ // i.e. we need to show
        par.show();
        $('table .' + aId, tt.browserKit.rootElement).show();
      }
      else if (!$(this).hasClass('active')) {
        par.hide();
        $('table .' + aId, tt.browserKit.rootElement).hide();
      }
    });
  });
  
  tt.modelKit = jToxModel.kits[0];
  tt.featuresList = $('#tt-features .list')[0];
  
  $('#tt-browser-panel .prev-field').on('click', function () { if ($(this).hasClass('paginate_enabled_previous')) loadCompound(tt.compoundIdx - 1); });
  $('#tt-browser-panel .next-field').on('click', function () { if ($(this).hasClass('paginate_enabled_next')) loadCompound(tt.compoundIdx + 1); });
  $('#tt-diagram .title').on('click', function () { updateSize('#tt-browser-panel'); });
  $('#sidebar .side-title>div').on('click', switchView);
  switchView('single');
  
  $(window).on('resize', function () { updateSize(null); });
  updateSize();
});
