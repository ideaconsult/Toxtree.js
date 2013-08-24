domready(function(){
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

	ToxMan.init({ 
		prefix: "toxtree",
		onalgoadd: function(row, idx){
			row.getElementsByClassName('show-hide')[0].onclick = function(e) { showhideInfo(this.parentNode); };
			
			// then put good id to auto checkboxes so that runAutos() can recognizes
			var auto = row.getElementsByClassName('auto')[0].id = ToxMan.prefix + "-auto-" + idx;
		},
		onrun: function(row, e){
			showhideInfo(row);
			e.stopPropagation();
		}
		
	});
	
	localMessage = languages[ConnMan.parameters.language !== undefined ? ConnMan.parameters.langauge : 'en'];
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
