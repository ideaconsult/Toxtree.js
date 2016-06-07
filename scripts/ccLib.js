var ccLib = {
  extendArray: function (base, arr) {
    // initialize, if needed
    if (base === undefined || base == null)
      base = [];
    else if (!jQuery.isArray(base))
      base = [base];

    // now proceed with extending
    if (arr !== undefined && arr !== null){
      for (var i = 0, al = arr.length; i < al; ++i){
        var v = arr[i];
        if (base.indexOf(v) < 0 && v !== undefined && v != null)
          base.push(v);
      }
    }
    return base;
  },

  extendNew: function (base) {
    var deep = false;
    var arr = null;
    if (typeof base == 'boolean') {
      deep = base;
      base = arguments[1];
      arr = Array.prototype.slice.call(arguments, 1);
    }
    else
      arr = arguments;

    for (var i = 1, al = arr.length;i < al; ++i) {
      var obj = arr[i];
      if (typeof obj != 'object')
        continue;
      for (var key in obj) {
        if (!base.hasOwnProperty(key))
          base[key] = (typeof obj[key] == 'object') ? window.jQuery.extend({}, obj[key]) : obj[key];
        else if (deep && typeof base[key] == 'object' && typeof obj[key] == 'object')
          this.extendNew(true, base[key], obj[key]);
      }
    }
    return base;
  },

  joinDeep: function (data, field, jn) {
    var arr = [];
    for (var i = 0, dl = data.length;i < dl; ++i)
      arr.push(this.getJsonValue(data[i], field));
    return arr.join(jn);
  },

  fireCallback: function (callback, self) {
    if (!jQuery.isArray(callback))
      callback = [callback];

    var ret = true;
    for (var i = 0, cl = callback.length; i < cl; ++i) {
      var callone = callback[i];
      if (typeof callone != 'function')
        callone = window[callone];
      ret = (typeof callone == 'function') ? (callone.apply((self !== undefined && self != null) ? self : document, Array.prototype.slice.call(arguments, 2))) : undefined;
    }
    return ret;
  },

  /* Function setObjValue(obj, value)Set a given to the given element (obj) in the most appropriate way - be it property - the necessary one, or innetHTML
  */
  setObjValue: function (obj, value){
  	if ((value === undefined || value === null) && jQuery(obj).data('default') !== undefined)
  		value = jQuery(obj).data('default');

    if (obj.nodeName == "INPUT" && obj.type == 'checkbox')
      obj.checked = !!value;
    else if (obj.nodeName == "INPUT" || obj.nodeName == "SELECT" || obj.nodeName == "TEXTAREA")
      obj.value = value;
    else if (obj.nodeName == "IMG")
      obj.src = value;
    else if (obj.nodeName == "BUTTON")
  		jQuery(obj).data('value', value);
    else
      obj.innerHTML = value;
  },

  getObjValue: function (obj){
    if (obj.nodeName == "INPUT" && obj.type == 'checkbox')
      return obj.checked;
    else if (obj.nodeName == "INPUT" || obj.nodeName == "SELECT")
      return obj.value;
    else if (obj.nodeName == "IMG")
      return obj.src;
    else if (obj.nodeName == "BUTTON")
  		return jQuery(obj).data('value');
    else
      return obj.innerHTML;
  },

  isEmpty: function(obj) {
    var empty = true;
    if (obj !== undefined || obj != null) {
      if (typeof obj == 'object') {
        for (var i in obj) {
          if (obj.hasOwnProperty(i)) {
            empty = false;
            break;
          }
        }
      }
      else if (typeof obj == 'string')
        empty = obj.trim().length == 0;
      else if (jQuery.isArray(obj))
        empty = obj.length == 0;
      else
        empty = false;
    }
    return empty;
  },

  enumObject: function(obj, fn, idx, level) {
    if (level == null)
      level = 0;
    if (typeof obj != "object")
      fn(obj, idx, level);
    else if (jQuery.isArray(obj)) // array
      for (var i = 0, l = obj.length; i < l; ++i)
        this.enumObject(obj[i], fn, i, level + 1);
    else // normal object
      for (var i in obj)
        this.enumObject(obj[i], fn, i, level + 1);
  },

  setJsonValue: function (json, field, val) {
    if (field != null){
      try {
        eval("json." + field + " = val");
      }
      catch(e){
        var arr = field.split('.');
        for (var i = 0, al = arr.length; i < al - 1; ++i)
          json = json[arr[i]] = {};

        json[arr[i]] = val;
      }
    }
  },

  getJsonValue: function (json, field) {
    var value = json[field];
    if (value === undefined && field != null) {
      try {
        eval("value = json." + field);
      }
      catch(e){
        ;
      }
    }
    return value;
  },
  
  findIndex: function (arr, obj) {
    if (arr.findIndex !== undefined)
      return arr.findIndex(obj);
    else if (typeof obj !== "function")
      return arr.indexOf(obj);
      
    for (var i = 0;i < arr.length; ++i)
      if (!!obj.call(arr[i], arr[i], i))
        return i;
      
    return -1;
  },
   
  // traverse any given tree, calling `pre` function before diggin in and `post` - after.
  // the output of pre determines how the digging is going to happen, if
  //  - is false - the digging further is interrupted;
  //  - is true or null/undefined - it uses node's `children` property for digging in
  //  - is something something - that value is used as a children array for digging in.
  traverseTree: function (tree, pre, post) {
    var arr = !!pre ? pre(tree) : true;
  
    if (arr === false) return;
    else if (arr === true || !arr) arr = tree.children;
      
    if (!!arr && !!arr.length)
      for (var i = 0;i < arr.length; ++i)
        this.traverseTree(arr[i], pre, post);
    
    if (!!post) 
      post(tree);
  },

  // given a root DOM element and an JSON object it fills all (sub)element of the tree
  // which has class 'data-field' and their name corresponds to a property in json object.
  // If prefix is given AND json has id property - the root's id set to to prefix + json.id
  fillTree: function (root, json, prefix, filter) {
    var self = this;
    if (json == null)
      return;
  	if (!filter)
  		filter = 'data-field';

  	var processFn = function(el, json){
  	  var value = self.getJsonValue(json, jQuery(el).data('field'));
      if (value !== undefined) {
        var format = jQuery(el).data('format');
        if ( !!format && (typeof window[format] == 'function') ) {
          value = window[format](value, json);
        }
        if (jQuery(el).hasClass('attribute'))
          jQuery(el).attr(jQuery(el).data('attribute'), value);
        else // the 'normal' value
          self.setObjValue(el, value);
      }
  	}

  	if (jQuery(root).hasClass(filter))
  		processFn(root, json);

    jQuery('.' + filter, root).each(function (i) { processFn(jQuery(this)[0], json); } );

    if (prefix && json.id !== undefined) {
      root.id = prefix + json.id;
    }
  },

  populateData: function (root, template, data, enumFn) {
    if (data == null || typeof data != 'object')
      return;

    var temp = $(template)[0];
    var oldDisp = root.style.display;
    root.style.display = 'none';
    for (var i = 0, dl = data.length; i < dl; ++i) {
      var el = temp.cloneNode(true);
      el.removeAttribute('id');
      if (this.fireCallback(enumFn, el, data[i]) === false)
        continue;

      root.appendChild(el);
      this.fillTree(el, data[i]);
    }

    root.style.display = oldDisp;
  },

  // Prepare a form so that non-empty fields are checked before submit and accumuater fields
  // are accumulated. Call it after you've set submit behavior, etc.
  prepareForm: function (form) {
  	var self = this;
	  var $ = window.jQuery;

		// first - attach the accumulators handler.
	  $('.accumulate', form).on('change', function (e) {
		  var target = $(this).data('accumulate');
		  if (!!target) {
		  	target = this.form[target];
		  	var val = target.value.replace(new RegExp('(' + this.value + ')'), '');
		  	if (this.checked)
			  	val += ',' + this.value;

			  target.value = val.replace(/,,/g, ',').replace(/^,/g, '').replace(/,$/g, ''); // change double commas with one, and replaces commas at the beginning and at the end
		  }
			return false;
	  });
  },

  packData: function (data) {
    var out = {};
    for (var i in data) {
      if (!data.hasOwnProperty(i))
        continue;
      var o = data[i];
      out[o.name] = o.value;
    }

    return out;
  },

  serializeForm: function (form) {
    return this.packData(window.jQuery(form).serializeArray());
  },

  flexSize: function (root) {
    var $ = jQuery;
    $('.cc-flex', root).each(function () {
      var el = this;
      var sum = 0;
      var horiz = $(el).hasClass('horizontal');
      $('.cc-fixed', el.offsetParent).each (function () {
        for (var fixed = this; fixed != el.offsetParent; fixed = fixed.parentNode)
          if ($(fixed).hasClass('cc-flex'))
            break;
        if (fixed == el.offsetParent)
          sum += horiz ? this.offsetWidth : this.offsetHeight;
      });
      el.style[horiz ? 'width' : 'height'] = (this.offsetParent[horiz ? 'clientWidth' : 'clientHeight'] - sum) + 'px';
    });
  },

	 // Check if the form is not-empty according to non-empty fields
  validateForm: function (form, callback) {
  	var self = this;
	  var ok = true;
	  jQuery('.validate', form).each(function () {
		  if (!self.fireCallback(callback, this))
		  	ok = false;
	  });

	  return ok;
  },
  /*
  Passed a HTML DOM element - it clears all children folowwing last one. Pass null for clearing all.
  */
  clearChildren: function(obj, last) {
    while (obj.lastChild && obj.lastChild != last) {
      obj.removeChild(obj.lastChild);
    }
  },

	/* formats a string, replacing {number | property} in it with the corresponding value in the arguments
  */
  formatString: function(format, pars) {
    for (var i in pars)
      format = format.replace('{' + i + '}', pars[i]);
    return format;
  },

  // Present a number in a brief format, adding 'k' or 'm', if needed.
  briefNumber: function (num, prec) {
    var suf = "",
        prec = prec || 10;
    
    if (num >= 900000)
      num /= 1000000, suf = "m";
    else if (num >= 900)
      num /= 1000, suf = "k";
    else
      prec = 0;
      
    if (prec <= 0)
      return num;
      
    num = Math.round(num * prec) / prec;
    return "" + num + suf;
  },

  trim: function(obj) {
    if (obj === undefined || obj == null)
      return '';
    if (typeof obj == "string")
      return obj.trim();
    else
      return obj;
  },

  copyToClipboard: function(text, prompt) {
    if (!prompt) {
      prompt = "Press Ctrl-C (Command-C) to copy and then Enter.";
    }
    window.prompt(prompt, text);
  },

  equalizeHeights: function() {
    var tabs = [];
    for (var i = 0;i < arguments.length; ++i) {
      tabs[i] = arguments[i].firstElementChild;
    }

    for (;;) {
      var height = 0;
      for (i = 0;i < tabs.length ; ++i) {
        if (tabs[i] == null)
          continue;

        if (!jQuery(tabs[i]).hasClass('lock-height') && tabs[i].style.height != '')
          tabs[i].style.height = "auto";

        if (tabs[i].offsetHeight > height)
          height = tabs[i].offsetHeight;
      }

      if (height == 0)
        break;

      for (i = 0;i < tabs.length ; ++i) {
        if (tabs[i] != null) {
          jQuery(tabs[i]).height(height);
          tabs[i] = tabs[i].nextElementSibling;
        }
      }
    }
  },

  positionTo: function (el, parent) {
    var ps = { left: -parent.offsetLeft, top: -parent.offsetTop };
    parent = parent.offsetParent;
    for (;!!el && el != parent; el = el.offsetParent) {
      ps.left += el.offsetLeft;
      ps.top += el.offsetTop;
    }
    return ps;
  },

  addParameter: function (url, param) {
    return url + (("&?".indexOf(url.charAt(url.length - 1)) == -1) ?  (url.indexOf('?') > 0 ? "&" : "?") : '') + param;
  },

  removeParameter: function (url, param) {
    return url.replace(new RegExp('(.*\?.*)(' + param + '=[^\&\s$]*\&?)(.*)'), '$1$3');
  },

  parseURL: function(url) {
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
        len = seg.length, i = 0, s, v, arr;
        for (;i<len;i++) {
          if (!seg[i]) { continue; }
          s = seg[i].split('=');
          v = (s.length>1)?decodeURIComponent(s[1].replace(/\+/g,  " ")):'';
          if (s[0].indexOf('[]') == s[0].length - 2) {
            arr = ret[s[0].slice(0, -2)];
            if (arr === undefined)
              ret[s[0].slice(0, -2)] = [v];
            else
              arr.push(v);
          }
          else
            ret[s[0]] = v;
        }
        return ret;
      })(),
      file: (a.pathname.match(/\/([^\/?#]+)$/i) || [,''])[1],
      hash: a.hash.replace('#',''),
      path: a.pathname.replace(/^([^\/])/,'/$1'),
      relative: (a.href.match(/tps?:\/\/[^\/]+(.+)/) || [,''])[1],
      segments: a.pathname.replace(/^\//,'').split('/')
    };
  },

  escapeHTML: function(str){
    var map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return str.replace(/[&<>"']/g, function(m) { return map[m]; });
  }

};

function ccNonEmptyFilter(v) {
  return v !== undefined && v != null && v != '';
}

// Formats JavaScript timestamp into human-readable presentation
function formatDate(timestamp) {
  var d = new Date(timestamp),
      day = d.getDate(),
      month = d.getMonth()+1,
      year = d.getFullYear();
  return ((day<10)?'0':'') + day + '.' + ((month<10)?'0':'') + month + '.' + d.getFullYear();
}

// Wrap string in a[href] tag if it is valid URL
function formatLink(str) {
  // https://gist.github.com/searls/1033143
  var p = /^(?:https?:\/\/|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’])$/i;
  if(str.search(p) != -1){
    str = '<a href="' + str + '" target="_blank">' + str + '</a>';
  }
  return str;
}

