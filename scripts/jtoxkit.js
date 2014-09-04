window.jT = window.jToxKit = {
	templateRoot: null,

	/* A single place to hold all necessary queries. Parameters are marked with {id} and formatString() (common.js) is used
	to prepare the actual URLs
	*/
	queries: {
		taskPoll: { method: 'GET', service: "/task/{id}" },
	},
	
	templates: { },        // html2js routine will fill up this variable
	tools: { },            // additional, external tools added with html2js

	/* SETTINGS. The following parametes can be passed in settings object to jT.init(), or as data-XXX - with the same names. Values set here are the defaults.
	*/
	settings: {
	  plainText: false,     // whether to expect result as plain text, and not JSON. Used in special cases like ketcher.
  	jsonp: false,         // whether to use JSONP approach, instead of JSON.
  	crossDomain: false,   // should it expect cross-domain capabilities for the queries.
  	baseUrl: null,        // the baseUrl for the server that loaded the page.
  	fullUrl: null,        // the url as it is on loading the page - this is parsed one, i.e. parseUrl() processed.
  	timeout: 15000,       // the timeout an call to the server should be wait before the attempt is considered error.
  	pollDelay: 250,       // after how many milliseconds a new attempt should be made during task polling.
  	onConnect: null,		  // function (service): called when a server request is started - for proper visualization. Part of settings.
  	onSuccess: null,	    // function (code, mess): called on server request successful return. It is called along with the normal processing. Part of settings.
  	onError: function (s, c, j) { if (!!console && !!console.log) console.log("jT call error [" + c + "]: " + j.responseText + " from request: [" + s + "]"); },		// called on server request error.
  },
  
  // these are used in setting inheritance, so that non-inheritable settings are blanked...
  blankSettings: {
    onDetails: null,
    noInterface: false,
    selectionHandler: null
  },
	
	// form the "default" baseUrl if no other is supplied
	formBaseUrl: function(url) {
    return !!url.host ? url.protocol + "://" + url.host + (url.port.length > 0 ? ":" + url.port : '') + '/' + url.segments[0] : null;
	},
    
  // initializes one kit, based on the kit name passed, either as params, or found within data-XXX parameters of the element
  initKit: function(element) {
    var self = this;

  	var dataParams = self.$(element).data();
  	var kit = dataParams.kit;
  	var topSettings = self.$.extend(true, {}, self.settings);
  	var parent = null;

  	// we need to traverse up, to collect some parent's settings...
  	self.$(self.$(element).parents('.jtox-toolkit').toArray().reverse()).each(function(){
  	  parent = self.kit(this);
    	if (!self.$(this).hasClass('jtox-widget') && parent != null) {
      	topSettings = self.$.extend(true, topSettings, parent.settings);
    	}
  	});
  	
  	// make us ultimate parent of all
  	if (!parent)
  	  parent = self;
  	  
    dataParams = self.$.extend(true, topSettings, self.blankSettings, dataParams);

	  // the real initialization function
    var realInit = function (params) {
    	if (!kit)
    		return null;
      // add jTox if it is missing AND there is not existing object/function with passed name. We can initialize ketcher and others like this too.
    	if (!window[kit] && kit.indexOf('jTox') != 0)
  	  	kit = 'jTox' + kit.charAt(0).toUpperCase() + kit.slice(1);
  
    	var fn = window[kit];
    	var obj = null;
      if (typeof fn == 'function')
    	  obj = new fn(element, params);
      else if (typeof fn == "object" && typeof fn.init == "function")
        obj = fn.init(element, params);
      
      if (obj != null) {
        if (fn.kits === undefined)
          fn.kits = [];
        fn.kits.push(obj);
        obj.parentKit = parent;
      }
      else
        console.log("jToxError: trying to initialize unexistend jTox kit: " + kit);

      return obj;
    };

	  // first, get the configuration, if such is passed
	  if (!ccLib.isNull(dataParams.configFile)) {
	    // we'll use a trick here so the baseUrl parameters set so far to take account... thus passing 'fake' kit instance
	    // as the first parameter of jT.call();
  	  self.call({ settings: dataParams}, dataParams.configFile, function(config){
    	  if (!!config)
    	    dataParams['configuration'] = self.$.extend(true, dataParams['configuration'], config);
        self.$(element).data('jtKit', realInit(dataParams));
  	  });
	  }
	  else {
	    if (!!window[dataParams.configuration] && typeof dataParams.configuration == "string") {
	      var config = window[dataParams.configuration];
	      dataParams.configuration = (typeof config != 'function' ? config : config(kit));
      }
  	  
      self.$(element).data('jtKit', realInit(dataParams));
	  }
  },
  
  // the jToxKit initialization routine, which scans all elements, marked as 'jtox-toolkit' and initializes them
	init: function(root) {
  	var self = this;
  	
  	if (!root) {
    	self.initTemplates();
  
      // make this handler for UUID copying. Once here - it's live, so it works for all tables in the future
      self.$(document).on('click', '.jtox-toolkit span.ui-icon-copy', function () { ccLib.copyToClipboard(self.$(this).data('uuid')); return false;});
      // install the click handler for fold / unfold
      self.$(document).on('click', '.jtox-foldable>.title', function() { self.$(this).parent().toggleClass('folded'); });
      // install diagram zooming handlers
      self.$(document).on('click', '.jtox-diagram span.ui-icon', function () { 
        self.$(this).toggleClass('ui-icon-zoomin').toggleClass('ui-icon-zoomout');
        self.$('img', this.parentNode).toggleClass('jtox-smalldiagram'); 
      });
      
      // scan the query parameter for settings
  		var url = self.settings.fullUrl = ccLib.parseURL(document.location);
  		var queryParams = url.params;
  		if (!queryParams.baseUrl)
  		  queryParams.baseUrl = self.formBaseUrl(url);
  	
      self.settings = self.$.extend(true, self.settings, queryParams); // merge with defaults
      root = document;
  	}

  	// now scan all insertion divs
  	self.$('.jtox-toolkit', root).each(function(i) { if (!self.$(this).data('manualInit')) self. initKit(this); });
	},
	
	kit: function (element) {
  	return $(element).data('jtKit');
	},
	
	parentKit: function(name, element) {
	  var self = this;
    var query = null;
    if (typeof name == 'string')
      name = window[name];
    self.$(element).parents('.jtox-toolkit').each(function() {
      var kit = self.kit(this);
      if (!kit || !!query)
        return;
      if (!name || kit instanceof name)
        query = kit;
    });
    
    return query;
  },
	
	initTemplates: function() {
	  var self = this;

    var root = self.$('.jtox-template')[0];
    if (!root) {
    	root = document.createElement('div');
    	root.className = 'jtox-template';
    	document.body.appendChild(root);
    }
    
	  var html = root.innerHTML;
  	for (var t in self.templates) {
    	html += self.templates[t];
  	}
  	
  	root.innerHTML = html;
  	self.templateRoot = root;
	},
	
	getTemplate: function(selector) {
  	var el = this.$(selector, this.templateRoot)[0];
  	if (!!el){
    	var el = el.cloneNode(true);
      el.removeAttribute('id');
    }
    return el;
	},
	
	insertTool: function (name, root) {
	  var html = this.tools[name];
	  if (!ccLib.isNull(html)) {
  	  root.innerHTML = html;
  	  this.init(root); // since we're pasting as HTML - we need to make re-traverse and initiazaltion of possible jTox kits.
    }
    return root;
	},
  
	/* Poll a given taskId and calls the callback when a result from the server comes - 
	be it "running", "completed" or "error" - the callback is always called.
	*/
	pollTask : function(kit, task, callback, jhr) {
		var self = this;
		if (task == null || task.task == null || task.task.length < 1 || !!task.task.error){
		  ccLib.fireCallback(callback, kit, task, jhr);
			return;
		}
		task = task.task[0];
		if (task.completed == -1){ // i.e. - running
			setTimeout(function(){
				self.call(kit, task.result, function(newTask, jhr){
					self.pollTask(kit, newTask, callback, jhr);
				});
			}, kit.settings.pollDelay);
		}
		else
  	  ccLib.fireCallback(callback, kit, task, jhr);
	},
	
	/* Deduce the baseUrl from a given Url - either if it is full url, of fallback to jToxKit's if it is local
	Passed is the first "non-base" component of the path...
	*/
	grabBaseUrl: function(url){
    if (!ccLib.isNull(url) && url.indexOf('http') == 0)
      return this.formBaseUrl(ccLib.parseURL(url));
    else
      return this.settings.baseUrl;
	},

  /* Grab the paging information from the given URL and place it into the settings of passed
  kit, as <kit>.settings.pageStart and <kit>.settings.pageSize. Pay attention that it is 'pageStart' 
  and not 'pageNo'.
  */
  grabPaging: function (kit, url) {
    var urlObj = ccLib.parseURL(url);
    if (urlObj.params['pagesize'] !== undefined) {
      var sz = parseInt(urlObj.params['pagesize']);
      if (sz > 0)
        kit.settings.pageSize = kit.pageSize = sz;
      url = ccLib.removeParameter(url, 'pagesize');
    }
    
    if (urlObj.params['page'] !== undefined) {
      var beg = parseInt(urlObj.params['page']);
      if (beg >= 0)
        kit.settings.pageStart = kit.pageStart = beg * kit.settings.pageSize;
      url = ccLib.removeParameter(url, 'page');
    }
    
    return url;
  },
	
	/* Makes a server call for provided service, with settings form the given kit and calls 'callback' at the end - always.
	The 'params', if passed, can have following attributes:
		'method': the HTTP method to be used
		'data': the data to be passed to the server with the request.
	*/
	call: function (kit, service, params, callback){
	  var self = this;
		if (typeof params != 'object') {
			callback = params; // the params parameters is obviously omitted
			params = {};
		}
		else if (params == null)
		  params = {};
		
	  var settings = self.$.extend({}, this.settings, params);
		if (kit == null)
		  kit = self;
		else 
  		settings = self.$.extend(settings, kit.settings);

		var accType = settings.plainText ? "text/plain" : (settings.jsonp ? "application/x-javascript" : "application/json");
		
		if (!params.data){
			params.data = {};
			if (settings.jsonp)
				params.data.media = accType;
				
			if (!params.method)
				params.method = 'GET';
		}
		else if (!params.method)
				params.method = 'POST';

		// on some queries, like tasks, we DO have baseUrl at the beginning
		if (service.indexOf("http") != 0)
			service = settings.baseUrl + service;
			
		ccLib.fireCallback(settings.onConnect, kit, service, params);
			
		// now make the actual call
		self.$.ajax(service, {
			dataType: params.dataType || (settings.plainText ? "text": (settings.jsonp ? 'jsonp' : 'json')),
			headers: { Accept: accType },
			crossDomain: settings.crossDomain || settings.jsonp,
			timeout: settings.timeout,
			type: params.method,
			data: params.data,
			jsonp: settings.jsonp ? 'callback' : false,
			error: function(jhr, status, error){
			  ccLib.fireCallback(settings.onError, kit, service, status, jhr);
				callback(null, jhr);
			},
			success: function(data, status, jhr){
			  ccLib.fireCallback(settings.onSuccess, kit, service, status, jhr);
				callback(data, jhr);
			}
		});
	}
};

/* UI related functions of jToxKit are put here for more convenient usage
*/
window.jT.ui = {
  shortenedData: function (content, message, data) {
    var res = '';
    
    if (ccLib.isNull(data))
      data = content;
    if (data.toString().length <= 5) {
      res += content;
    }
    else {
      res += '<div class="shortened">' + content + '</div>';
      if (message != null)
        res += '<span class="ui-icon ui-icon-copy" title="' + message + '" data-uuid="' + data + '"></span>';
    }
    return res;
  },
  
  changeTabsIds: function (root, suffix) {
    jT.$('ul li a', root).each(function() {
      var id = jT.$(this).attr('href').substr(1);
      var el = document.getElementById(id);
      id += suffix;
      el.id = id;
      jT.$(this).attr('href', '#' + id);
    })  
  },
  
  addTab: function(root, name, id, content) {
    // first try to see if there is same already...
    if (document.getElementById(id) != null)
      return;
  
    // first, create and add li/a element
    var li = document.createElement('li');
    var a = document.createElement('a');
    li.appendChild(a);
    a.href = '#' + id;
    a.innerHTML = name;
    jT.$('ul', root)[0].appendChild(li);
    
    // then proceed with the panel, itself...
    if (typeof content == 'function')
      content = content(root);
    else if (typeof content == 'string') {
      var div = document.createElement('div');
      div.innerHTML = content;
      content = div;
    }
      
    content.id = id;
    root.appendChild(content);
    $(root).tabs('refresh');
    return { 'tab': a, 'content': content };
  },
  
  modifyColDef: function (kit, col, category, group) {
    if (col.sTitle === undefined || col.sTitle == null)
      return null;
      
	  var name = col.sTitle.toLowerCase();
	  
	  // helper function for retrieving col definition, if exists. Returns empty object, if no.          
	  var getColDef = function (cat) {
	    var catCol = kit.settings.configuration.columns[cat];
	    if (!ccLib.isNull(catCol)) {
	      if (!!group) {
	        catCol = catCol[group];
  	      if (!ccLib.isNull(catCol))
  	        catCol = catCol[name];
        }
        else
	        catCol = catCol[name];
	    }
	
	    if (ccLib.isNull(catCol))
	      catCol = {};
	    return catCol;
	  };
	  // now form the default column, if existing and the category-specific one...
	  // extract column redefinitions and merge them all.
	  col = jT.$.extend(col, (!!group ? getColDef('_') : {}), getColDef(category));
	  return ccLib.isNull(col.bVisible) || col.bVisible ? col : null;
  },
  
  sortColDefs: function (colDefs) {
	  colDefs.sort(function(a, b) {
	    var valA = ccLib.isNull(a.iOrder) ? 0 : a.iOrder;
	    var valB = ccLib.isNull(b.iOrder) ? 0 : b.iOrder;
	    return valA - valB;
	  });
  },
  
  processColumns: function (kit, category) {
    var colDefs = [];
    var catList = kit.settings.configuration.columns[category];
    for (var name in catList) {
      var col = this.modifyColDef(kit, catList[name], category);
      if (col != null)
        colDefs.push(col);
    }
      
    this.sortColDefs(colDefs);
    return colDefs;
  },
  
  inlineChanger: function (location, breed, holder) {
    if (breed == "select")
      return function (data, type, full) {
        return type != 'display' ? (data || '') : '<select class="jt-inlineaction" data-data="' + location + '" value="' + (data || '') + '">' + (holder || '') + '</select>';
      };
    else if (breed == "checkbox") // we use holder as 'isChecked' value
      return function (data, type, full) {
        return type != 'display' ? (data || '') : '<input type="checkbox" class="jt-inlineaction" data-data="' + location + '"' + (((!!holder && data == holder) || !!data) ? 'checked="checked"' : '') + '"/>';
      };
    else if (breed =="text")
      return function (data, type, full) {
        return type != 'display' ? (data || '') : '<input type="text" class="jt-inlineaction" data-data="' + location + '" value="' + (data || '') + '"' + (!holder ? '' : ' placeholder="' + holder + '"') + '/>';
      };
  },
  
  inlineRowFn: function (on) {
    return function( nRow, aData, iDataIndex ) {
      $('.jt-inlineaction', nRow).each(function () {
        ccLib.fireCallback(on.init, this, aData, iDataIndex);
        var action = $(this).data('action') || 'change';
        if (this.tagName == 'INPUT' || this.tagName == 'SELECT' || this.tagName == "TEXTAREA")
          $(this).on('change', on[action]).on('keydown', jT.ui.enterBlur);
        else
          $(this).on('click', on[action]);
      });
    }
  },
  
  installMultiSelect: function (root, callback, parenter) {
    if (parenter == null)
      parenter = function (el) { return el.parentNode; };
    $('a.select-all', root).on('click', function (e) {
      $('input[type="checkbox"]', parenter(this)).each(function () { this.checked = true; if (callback == null) jT.$(this).trigger('change'); });
      if (callback != null)
        callback.call(this, e);
    });
    $('a.unselect-all', root).on('click', function (e) {
      $('input[type="checkbox"]', parenter(this)).each(function () { this.checked = false; if (callback == null) jT.$(this).trigger('change');});
      if (callback != null)
        callback.call(this, e);
    });
  },
  
  installHandlers: function (kit, root) {
    if (kit.settings.configuration == null || kit.settings.configuration.handlers == null)
      return;
    if (root == null)
      root = kit.rootElement;
      
    jT.$('.jtox-handler', root).each(function () {
      var name = jT.$(this).data('handler');
      var handler = kit.settings.configuration.handlers[name] || window[name];
      if (!handler)
        console.log("jToxQuery: referring unknown handler: " + name);
      else if (this.tagName == "BUTTON")
        jT.$(this).on('click', handler);
      else // INPUT, SELECT
        jT.$(this).on('change', handler);
    });
  },
  
  enterBlur: function (e) {
    if (e.keyCode == 13)
      this.blur();
  },
  
  rowData: function (el) {
    var row = $(el).closest('tr')[0];
    var table = $(row).closest('table')[0];
    return $(table).dataTable().fnGetData(row);
  },
  
  rowInline: function (el, base) {
    var row = $(el).closest('tr')[0];
    var data = $.extend({}, base);
    $('.jt-inlineaction', row).each(function () {
      var loc = $(this).data('data');
      if (loc != null)
        ccLib.setJsonValue(data, loc, ccLib.getObjValue(this));
    });
    
    return data;
  },
  
  columnData: function (cols, data, type) {
    var out = new Array(data.length);
    if (type == null)
      type = 'display';
    for (var i = 0, dl = data.length; i < dl; ++i) {
      var entry = {};
      var d = data[i];
      for (var c = 0, cl = cols.length; c < cl; ++c) {
        var col = cols[c];
        var val = ccLib.getJsonValue(d, col.mData) || col.sDefaultValue;
        entry[col.sTitle] = typeof col.mRender != 'function' ? val : col.mRender(val, type, d);
      }
      
      out[i] = entry;
    }
    
    return out;
  },
  
  queryInfo: function (aoData) {
    var info = {};
    for (var i = 0, dl = aoData.length; i < dl; ++i)
      info[aoData[i].name] = aoData[i].value;
  
    if (info.iSortingCols > 0) {
      info.iSortDirection = info.sSortDir_0.toLowerCase();
      info.sSortData = info["mDataProp_" + info.iSortCol_0];
    }
    else {
      info.iSortDirection = 0;
      info.sSortData = "";
    }
    
    return info;
  },
  
  putTable: function (kit, root, config, settings) {
    var opts = jT.$.extend({
      "bPaginate": false,
      "bProcessing": true,
      "bLengthChange": false,
  		"bAutoWidth": false,
      "sDom" : kit.settings.sDom,
  		"oLanguage": kit.settings.oLanguage,
      "bServerSide": false,
      "fnCreatedRow": function( nRow, aData, iDataIndex ) {
        // handle a selection click.. if any
        jT.ui.installHandlers(kit, nRow);
        if (typeof kit.settings.selectionHandler == "function")
          jT.$('input.jt-selection', nRow).on('change', kit.settings.selectionHandler);
        // other (non-function) handlers are installed via installHandlers().

        if (!!kit.settings.onDetails) {
          jT.$('.jtox-details-toggle', nRow).on('click', function(e) {  
            var root = jT.ui.toggleDetails(e, nRow);
            if (!!root) {
              ccLib.fireCallback(kit.settings.onDetails, kit, root, jT.$(this).data('data'), e);
            }
          });
        }
      }
    }, settings);
    
    if (opts.aoColumns == null)
      opts.aoColumns = jT.ui.processColumns(kit, config);
    if (opts.oLanguage == null)
      delete opts.oLanguage;

    var table = jT.$(root).dataTable(opts);
    jT.$(table).dataTable().fnAdjustColumnSizing();
    return table;
  },
  
  renderRelation: function (data, type, full) {
    if (type != 'display')
      return ccLib.joinDeep(data, 'relation', ',');
      
    var res = '';
    for (var i = 0, il = data.length; i < il; ++i)
      res += '<span>' + data[i].relation.substring(4).toLowerCase() + '</span><sup><a target="_blank" href="' + (full.URI + '/composition') + '" title="' + data[i].compositionName + '(' + data[i].compositionUUID + ')">?</a></sup>';
  
    return res;
  },
  
  putStars: function (kit, stars, title) {
    if (!kit.settings.shortStars) {
      var res = '<div title="' + title + '">';
      for (var i = 0;i < kit.settings.maxStars;++i) {
        res += '<span class="ui-icon ui-icon-star jtox-inline';
        if (i >= stars)
          res += ' transparent';
        res += '"></span>';
      }
      return res + '</div>';
    }
    else { // i.e. short version
      return '<span class="ui-icon ui-icon-star jtox-inline" title="' + title + '"></span>' + stars;
    }
  },
  
  updateCounter: function (str, count, total) {
    var re = null;
    var add = '';
    if (count == null)
      count = 0;
    if (total == null) {
      re = /([^(]*)\(([\d\?]+)\)/;
      add = '' + count;
    }
    else {
      re = /([^(]*)\(([\d\?]+\/[\d\?\+-]+)\)/;
      add = '' + count + '/' + total;
    }
    
    // now the addition    
    if (!str.match(re))
      str += ' (' + add + ')';
    else
      str = str.replace(re, "$1(" + add + ")");
    
    return str;
  },
    
  bindControls: function (kit, handlers) {
    var pane = jT.$('.jtox-controls', kit.rootElement)[0];
    if (kit.settings.showControls) {
      ccLib.fillTree(pane, { "pagesize": kit.settings.pageSize });
      jT.$('.next-field', pane).on('click', handlers.nextPage);
      jT.$('.prev-field', pane).on('click', handlers.prevPage);
      jT.$('select', pane).on('change', handlers.sizeChange)
      var pressTimeout = null;
      jT.$('input', pane).on('keydown', function(e) {
        var el = this;
        if (pressTimeout != null)
          clearTimeout(pressTimeout);
        pressTimeout = setTimeout(function () { handlers.filter.apply(el, [e]); }, 350);
      });
    }
    else // ok - hide me
      pane.style.display = "none";
  },

  putActions: function (kit, col, ignoreOriginal) {
    if (!!kit.settings.selectionHandler || !!kit.settings.onDetails) {
      var oldFn = col.mRender;
      var newFn = function (data, type, full) {
        var html = oldFn(data, type, full);
        if (type != 'display')
          return html;
          
        if (!!ignoreOriginal)
          html = '';
          
        // this is inserted BEFORE the original, starting with given PRE-content
        if (!!kit.settings.selectionHandler)
          html = '<input type="checkbox" value="' + data + '" class="' +
                (typeof kit.settings.selectionHandler == 'string' ? 'jtox-handler" data-handler="' + kit.settings.selectionHandler + '"' : 'jt-selection"') +
                '/>' + html;
                
        // strange enough - this is inserted AFTER the original
        if (!!kit.settings.onDetails)
          html += '<span class="jtox-details-toggle ui-icon ui-icon-folder-collapsed" data-data="' + data +'" title="Press to open/close detailed info for this entry"></span>';

        return html;
      };
      
      col.mRender = newFn;
    }
    return col;
  },
  
  toggleDetails: function (event, row) {
    self.$(event.currentTarget).toggleClass('ui-icon-folder-collapsed');
    self.$(event.currentTarget).toggleClass('ui-icon-folder-open');
    self.$(event.currentTarget).toggleClass('jtox-openned');
    if (!row)
      row = self.$(event.currentTarget).parents('tr')[0];

    var cell = self.$(event.currentTarget).parents('td')[0];
    
    if (self.$(event.currentTarget).hasClass('jtox-openned')) {
      var detRow = document.createElement('tr');
      var detCell = document.createElement('td');
      detRow.appendChild(detCell);
      self.$(detCell).addClass('jtox-details');
      
      detCell.setAttribute('colspan', self.$(row).children().length - 1);
      row.parentNode.insertBefore(detRow, row.nextElementSibling);

      cell.setAttribute('rowspan', '2');
      return detCell;
    }
    else {
      cell.removeAttribute('rowspan');
      self.$(self.$(row).next()).remove();
      return null;
    }
  }
};

// we need to do this here - because other tools/libraries could have scheduled themselves on 'ready',
// so it'll be too late to make this assignment then. Also - we can use jT.$ from now on :-)
jT.$ = jQuery; // .noConflict();

  	
jT.$(document).ready(function(){
  jT.init();
});
