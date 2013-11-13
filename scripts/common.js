/* 
	common.js - Common, helper functions for value propagations, and similar DOM manipulations.
	Created by Ivan Georgiev, 2013.

*/

/* Function setObjValue(obj, value)Set a given to the given element (obj) in the most appropriate way - be it property - the necessary one, or innetHTML
*/
function setObjValue(obj, value){
	if ((value === undefined || value === null) && obj.dataset.default !== undefined)
		value = obj.dataset.default;

  if (obj.nodeName == "INPUT" || obj.nodeName == "SELECT")
    obj.value = value;
  else if (obj.nodeName == "IMG")
    obj.src = value;
  else if (obj.nodeName == "BUTTON")
		obj.dataset.value = value;
  else
    obj.innerHTML = value;
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
