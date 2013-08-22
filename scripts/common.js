domready(function(){
  var flexs = document.getElementsByClassName('layouted-flexible');
  for (var i = 0; i < flexs.length; ++i) {
    flexSchedule(flexs[i], flexVertically);
  }

	// first initialize some general stuff - connection, list of supported algorithms, etc.
	attachButtons(document);
	ConnMan.init();
	localMessage = languages[ConnMan.parameters.language !== undefined ? ConnMan.parameters.langauge : 'en'];
	ToxMan.init('toxtree', document.getElementById('query-form'));
	ToxMan.listAlgos();
	
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

function attachButtons(root){
  // setup all buttons with data-action attribute
  var buttons = root.getElementsByTagName("button");
  var butcnt = buttons.length;
  for (var i = 0;i < butcnt; i++){
    var button = buttons[i];

    // add onclick handler only if there is non-empty data-action or data-click
    if (button.dataset.action && button.dataset.action !='') {
      button.onclick = function (e){
			  dataButtonClick(e.currentTarget);
			  e.stopPropagation();
			  return false;
			};
    }
    else if (button.dataset.click && button.dataset.click !='' && typeof window[button.dataset.click] == 'function') {
      button.onclick = window[button.dataset.click];
    }
  }
}

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

function flexSchedule(theFlexible, flexfn) {
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

// show the active view and hide the others
function showPanel(panel, data){
  var panelel = document.getElementById(panel);
  if(!panelel || panelel.classList.contains('visible')){
    return false;
  }
  var panels = document.querySelectorAll('.panel.visible');
  for(var i = 0; i < panels.length; i++){
    panels[i].classList.remove('visible');
    panels[i].classList.add('hidden');
  }

  // Force reflow so that the removing of class hidden is applied.
  panelel.classList.add('visible');
  return true;
}

function getActivePanel() {
  return document.querySelectorAll('.panel.visible')[0].id;
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

function dataButtonClick(but){
  var pars = but.dataset.params;
  if (but.dataset.value !== undefined && but.dataset.field !== undefined) {
    pars = pars.replace("<" + but.dataset.field + ">", but.dataset.value);
  }
  ConnMan.callQuery(but.dataset.action, pars);
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
  var dataList = root.getElementsByClassName(filter ? filter : 'data-field');
  var dataCnt = dataList.length;

  for (var i = 0; i < dataCnt; ++i) {
    var el = dataList[i];
    if (json[el.dataset.field] !== undefined) {
      var value = json[el.dataset.field];
      if ( el.dataset.filter !='' && (typeof window[el.dataset.filter] == 'function') ) {
        value = window[el.dataset.filter](value);
      }
      setObjValue(el, value);
    }
  }

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

/*
 * General message-box functionalty
 *
 * @param message The message to be shown to user, accepts HTML, be carefull!
 * @param type What buttons to show, currently "yes-no" and "ok-only" supported. "none" is used to hide it.
 * @param success Callback function to be executed when user accepts (clicks Ok or Yes)
 * @param cancel Callback function to be executed when the dialog is canceled.
 *
 * Example:
 * messageBox('alabala posrtokala.', 'yes-no', function(){alert('yes');}, function(){alert('no');});
 *
 */
var messageBox = (function(){

  var box = message = buttons = success = cancel = null,
      self = this;

  domready(function(){

    self.box = document.getElementById('message-box');
    if (!self.box)
    	return false;
    self.message = this.box.getElementsByTagName('p')[0];
    self.buttons = this.box.getElementsByTagName('button');

    self.box.classList.add('hidden');

    for(var i = 0, bl = buttons.length; i < bl; i++){
      buttons[i].onclick = function(){
        self.box.classList.remove('visible');
        if(typeof self[this.dataset.action]  == 'function'){
          self[this.dataset.action]();
        }
        (function(self){
          setTimeout(function(){
            self.box.classList.add('hidden');
          }, 500);
        })(self);
      }
    }

  });

  return function(message, type, success, cancel){
    if (type == 'none') {
      self.box.classList.remove('visible');
      setTimeout(function(){
        self.box.classList.add('hidden');
      }, 500);
      return;
    }
    else if(type == undefined || type == '') {
      type = 'ok-only';
    }
    self.box.className = type;
    self.message.innerHTML = message;
    var t = self.box.clientWidth;
    self.success = success;
    self.cancel = cancel;
    self.box.classList.add('visible');
  }

})();
