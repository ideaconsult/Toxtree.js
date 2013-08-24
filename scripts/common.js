domready(function(){
  var flexs = document.getElementsByClassName('layouted-flexible');
  for (var i = 0; i < flexs.length; ++i) {
    flexSchedule(flexs[i], flexVertically);
  }

	// first initialize some general stuff - connection, list of supported algorithms, etc.
	ConnMan.init();
	localMessage = languages[ConnMan.parameters.language !== undefined ? ConnMan.parameters.langauge : 'en'];
	ToxMan.init('toxtree', document.getElementById('query-form'));
	
	// some behavioural setup
	// now attach the handler for clicking on the line which opens / hides it.
	var showhideInfo = function(row){
		var info = row.getElementsByClassName('info')[0];
		if (row.classList.contains('visible')){
			row.classList.remove('visible');
			info.classList.add('hidden');
		}
		else{
			row.classList.add('visible');
			info.classList.remove('hidden');
		}
	}
	
	ToxMan.listAlgos(
		function(e){  // onclick handler
			showhideInfo(this.parentNode);
		},
		function(row, e){ // on run button handler. 
			showhideInfo(row);
			e.stopPropagation();
		}
	);
	
	// now attach the query button
	var needle = document.getElementById('query-needle');
	var query = document.getElementById('query-button');
	if (query && needle){
		needle.onchange = query.onclick = function(e){
			if (needle.value.length > 0){
				ToxMan.query(needle.value);
				needle.setAttribute('placeholder', needle.value + "_");
				needle.value = '';
			}
		}
	}
});

/* Event handling helpers - the first one attaches event handler in browser-independent way
*/
function addEventHandler(el, event, handlefn, delay) {
  var realfn = handlefn;
  if (delay) {
    var timeout = null;
    realfn = function (e) {
      if (!!timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(handlefn, 200);
    };
  }

  if (window.addEventListener) { //WC3 browsers
    el.addEventListener(event, realfn, false);
  }
  else if (window.attachEvent) { //if IE (and Opera depending on user setting)
    el.attachEvent('on' + event, realfn);
  }
}

function applyEvent(elem, type, name, bubbles) {
  if (elem.fireEvent) {
    elem.fireEvent('on' + name);
  }
  else {
    var evt = document.createEvent(type);
    evt.initEvent(name, bubbles, false);
    elem.dispatchEvent(evt);
  }
}

function flexSetup(theFlexible, flexfn) {
	flexfn(theFlexible);
  addEventHandler(window, 'resize', function (e) { flexfn(theFlexible); }, true);
}

function flexVertically(theFlexible) {
  if (theFlexible === undefined) {
    return false;
  }
  var theParent = theFlexible;
  while (theParent.parentNode != document && !theParent.classList.contains('layouted-root')) {
    theParent = theParent.parentNode;
  }
  var newHeight = theParent.clientHeight;
  if (newHeight < 1) {
    return false; // it is most probably hidden, anyways.
  }
  var fixes = theParent.getElementsByClassName('layouted-fixed');
  for (var j = 0;j < fixes.length; ++j) {
    newHeight -= fixes[j].offsetHeight;
  }

  theFlexible.style.height = newHeight + "px";
}

function flexHorizontally(theFlexible) {
  if (theFlexible === undefined) {
    return false;
  }
  var theParent = theFlexible;
  while (theParent.parentNode != document && !theParent.classList.contains('layouted-root')) {
    theParent = theParent.parentNode;
  }
  var newWidth = theParent.clientHeight;
  if (newWidth < 1) {
    return false; // it is most probably hidden, anyways.
  }
  var fixes = theParent.getElementsByClassName('layouted-fixed');
  for (var j = 0;j < fixes.length; ++j) {
    newWidth -= fixes[j].offsetWidth;
  }

  theFlexible.style.width = newWidth + "px";
}

function findPos(obj) {
  if(obj.getBoundingClientRect){
    return obj.getBoundingClientRect();
  }
  var curleft = curtop = 0;
  if (obj.offsetParent) {
    do {
      curleft += obj.offsetLeft;
      curtop += obj.offsetTop;
    } while (obj = obj.offsetParent);
  }
  return {left: curleft, top: curtop};
}

// show dialog-like element as overlay above the current view
function showDialog(dialog, data){
  if((typeof(dialog)).toLowerCase() == 'string'){
    var dlg = document.getElementById(dialog);
  }
  else{
    var dlg = dialog;
  }
  if(dlg){
    dlg.classList.remove('hidden');
    var t = dlg.clientHeight;
    ReplyMan.process('dialogshow', dlg);
    ReplyMan.process('dialogshow-' + dlg.id, data);
    (function(dlg){
      setTimeout(function(){
        dlg.classList.add('visible');
      }, 0);
    })(dlg);
    return dlg;
  }
}

// hide a dialog-like element
function hideDialog(dialog, data){
  if( (typeof(dialog)).toLowerCase() == 'string' || dialog instanceof String ){
    var dlg = document.getElementById(dialog);
  }
  else{
    var dlg = dialog;
  }
  if (dlg){
    dlg.classList.remove('visible');
    ReplyMan.process('dialoghide', dlg);
    ReplyMan.process('dialoghide-' + dlg.id, data);
    (function(dlg){
      setTimeout(function(){
        dlg.classList.add('hidden');
      }, 300);
    })(dlg);
  }
}

function hideAllDialogs(exclude) {
  var s = '.dialog.visible';
  if(exclude != ''){
    s += ':not(' + exclude + ')';
  }
  var dlgs = document.querySelectorAll(s);
  for (var i = 0;i < dlgs.length; ++i){
    hideDialog(dlgs[i]);
  }
}

// set the radio button with the given value as being checked
// do nothing if there are no radio buttons
// if the given value does not exist, all the radio buttons
// are reset to unchecked
function setCheckedValue(radioObj, newValue) {
  if(!radioObj) {
    return;
  }
  var radioLength = radioObj.length;
  if(radioLength == undefined) {
    radioObj.checked = (radioObj.value == newValue.toString());
    return;
  }
  for(var i = 0; i < radioLength; i++) {
    radioObj[i].checked = false;
    if(radioObj[i].value.toLowerCase() == newValue.toString().toLowerCase()) {
      radioObj[i].checked = true;
      if(radioObj[i].onchange) {
        radioObj[i].onchange();
      }
    }
  }
}

function getRadioButtonValue(radio) {
  for (var i = 0; i < radio.length; i++) {
    if (radio[i].checked) {
      return radio[i].value;
    }
  }
  return "";
}


function getObjValue(obj){
  if (obj.nodeName == "INPUT" || obj.nodeName == "SELECT") {
    return obj.value;
  }
  else {
    if (obj.nodeName == "IMG") {
      return obj.src;
    }
    else {
      if (obj.nodeName == "BUTTON") {
        return obj.dataset.value;
      }
      else {
        return obj.innerHTML;
      }
    }
  }
}

function setObjValue(obj, value){
  if (obj.nodeName == "INPUT" || obj.nodeName == "SELECT") {
    obj.value = value;
  }
  else {
    if (obj.nodeName == "IMG"){
      if (value !== undefined) {
        if( value != '') {
          obj.src = value;
        }
        else {
          obj.src = obj.dataset.default;
        }
      }
    }
    else {
      if (obj.nodeName == "BUTTON") {
        obj.dataset.value = value;
      }
      else {
        obj.innerHTML = value;
      }
    }
  }
}

/*
Passed a HTML DOM element - it clears all children folowwing last one. Pass null for clearing all.
*/
function clearChildren(obj, last) {
  while (obj.lastChild && obj.lastChild != last) {
    obj.removeChild(obj.lastChild);
  }
}

/* formats a string, replacing [<number>] in it with the corresponding value in the arguments
*/
function formatString(format) {
  for (var i = 1;i < arguments.length; ++i) {
    format = format.replace('<' + i + '>', arguments[i]);
  }
  return format;
}

// given a root DOM element and an JSON object it fills all (sub)element of the tree
// which has class 'data-field' and their name corresponds to a property in json object.
// If prefix is given AND json has id property - the root's id set to to prefix + json.id
function fillTree(root, json, prefix, filter) {
	if (!filter)
		filter = 'data-field';
  var dataList = root.getElementsByClassName(filter);
  var dataCnt = dataList.length;
	
	var processFn = function(el, json){
    if (json[el.dataset.field] !== undefined) {
      var value = json[el.dataset.field];
      if ( el.dataset.filter !='' && (typeof window[el.dataset.filter] == 'function') ) {
        value = window[el.dataset.filter](value);
      }
      setObjValue(el, value);
    }
	}
	
	if (root.classList.contains(filter))
		processFn(root, json);

  for (var i = 0; i < dataCnt; ++i)
  	processFn(dataList[i], json);

  if (prefix && json.id !== undefined) {
    root.id = prefix + json.id;
  }
}

function parseURL(url) {
  var a =  document.createElement('a');
  a.href = url;
  return {
    source: url,
    protocol: a.protocol.replace(':',''),
    host: a.hostname,
    port: a.port,
    query: a.search,
    params: (function(){
      var ret = {},
        seg = a.search.replace(/^\?/,'').split('&'),
        len = seg.length, i = 0, s;
      for (;i<len;i++) {
        if (!seg[i]) { continue; }
        s = seg[i].split('=');
        ret[s[0]] = (s.length>1)?decodeURIComponent(s[1].replace(/\+/g,  " ")):'';
      }
      return ret;
    })(),
    file: (a.pathname.match(/\/([^\/?#]+)$/i) || [,''])[1],
    hash: a.hash.replace('#',''),
    path: a.pathname.replace(/^([^\/])/,'/$1'),
    relative: (a.href.match(/tps?:\/\/[^\/]+(.+)/) || [,''])[1],
    segments: a.pathname.replace(/^\//,'').split('/')
  };
}
