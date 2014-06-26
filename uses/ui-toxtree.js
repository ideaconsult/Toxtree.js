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
    "http://www.opentox.org/api/1.1#TradeName",
    "http://www.opentox.org/api/1.1#IUPACName",
    "http://www.opentox.org/api/1.1#SMILES",
    "http://www.opentox.org/api/1.1#InChIKey",
    "http://www.opentox.org/api/1.1#InChI",
    "http://www.opentox.org/api/1.1#REACHRegistrationDate"
  ]
};

var config_toxtree = {
	"handlers": {
  	"query": function (e, query) {
      $(tt.featuresList).empty();
      $('#tt-diagram img.toxtree-diagram')[0].src = '';
      query.query();  
    },
    "checked": function (e, query) {
      // TODO: initiate the single compound browser to work on selected only
    }
	}
};



function onSelectedUpdate(e) {
	var tEl = $('#tt-models-panel .title')[0];
	var v = $('input[type="checkbox"]:checked', tt.modelKit.rootElement).length;
	tEl.innerHTML = jT.ui.updateCounter(tEl.innerHTML, v, tt.modelKit.algorithm.length);;
}

function runPrediction(el, compoundUri, algorithmUri) {
  // TODO it here!
  console.log("Run prediction for compoundUri: " + compoundUri + ", algorithmUri: " + algorithmUri);  
}

function onAlgoLoaded(result) {
  ccLib.populateData(tt.modelKit.rootElement, '#tt-algorithm', result.algorithm);
  $('input[type="checkbox"]', tt.modelKit.rootElement).on('click', function (e) {
    onSelectedUpdate(e);
    e.stopPropagation();
  });
  $('input[type="button"]', tt.modelKit.rootElement).on('click', function (e) {
    if (!$(this).hasClass('loaded')) {
      var ael = $('a', $(this).parents('.title')[0])[0];
      runPrediction(this, tt.browserKit.dataset.dataEntry[tt.compoundIdx].compound.URI, ael.href);
      e.stopPropagation();
    }
  });

  onSelectedUpdate(null);
}

function resizeFeatures(e) {
  var timer = null;
  if (timer != null)
    clearTimeout(timer);
  var timer = setTimeout(function () {
    var bigpane = $('#tt-bigpane')[0];
    $(bigpane).height(document.body.offsetHeight - bigpane.offsetTop);

    var bropane = $('#tt-browser-panel');
    bropane.height(document.body.offsetHeight - bigpane.offsetTop);
    
    var listpane = $('#tt-features .list')[0];
    $(listpane).height(bropane.height() - $('#tt-diagram').height() - listpane.offsetTop - 30); // 30 comes from padding + border styling...
  }, 100);
}

function addFeatures() {
  var features = null;
  var kit = this;
  if (kit == tt.browserKit) { // Lot more things to be done here...
    kit = tt.browserKit;
    features = tt.coreFeatures;
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
  }
  else {
    features = Object.keys(kit.dataset.feature);
    // TODO: some preprocessing for other kits? Like grouping row?
  }
  
  if (kit.dataset.dataEntry[tt.compoundIdx] != null) {
    var data = kit.featureData(kit.dataset.dataEntry[tt.compoundIdx], features);
    ccLib.populateData(tt.featuresList, '#tt-feature', data);
  }
}

function showCompound(index) {
  if (index < 0 && tt.browserKit.pageStart > 0) { // we might need a reload...
    tt.compoundIdx = tt.browserKit.pageSize - 1;
    tt.browserKit.prevPage();
  }
  else if (index >= tt.browserKit.dataset.dataEntry.length) {
    tt.compoundIdx = 0;
    tt.browserKit.nextPage();
  }
  else { // normal showing up
    tt.compoundIdx = index;
    $(tt.featuresList).empty();
    $('#tt-diagram img.toxtree-diagram')[0].src = '';
    resizeFeatures();
    
    addFeatures.call(tt.browserKit);
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
  showCompound(idx);
  switchView('single');
  return false;  
}

$(document).ready(function(){
  $('#tt-models-panel a.select-all').on('click', function () {
    $('#tt-models-panel input[type="checkbox"]').each(function () { this.checked = true;});
    onSelectedUpdate.call(this);
  });
  $('#tt-models-panel a.unselect-all').on('click', function () {
    $('#tt-models-panel input[type="checkbox"]').each(function () { this.checked = false;});
    onSelectedUpdate.call(this);
  });
  
  tt.browserKit = jToxCompound.kits[0];
  tt.modelKit = jToxModel.kits[0];
  tt.featuresList = $('#tt-features .list')[0];
  
  $('#tt-browser-panel .prev-field').on('click', function () { if ($(this).hasClass('paginate_enabled_previous')) showCompound(tt.compoundIdx - 1); });
  $('#tt-browser-panel .next-field').on('click', function () { if ($(this).hasClass('paginate_enabled_next')) showCompound(tt.compoundIdx + 1); });
  $('#tt-diagram .title').on('click', resizeFeatures);
  $('#sidebar .side-title>div').on('click', switchView);
  switchView('single');
  
  $(window).on('resize', resizeFeatures);
  resizeFeatures(null);
});
