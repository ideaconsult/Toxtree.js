window.jToxKit = {
	templateRoot: null,

	/* A single place to hold all necessary queries. Parameters are marked with <XX> and formatString() (common.js) is used
	to prepare the actual URLs
	*/
	queries: {
		taskPoll: "/task/<1>",
	},
	
	templates: { },        // html2js routine will fill up this variable

	/* SETTINGS. The following parametes can be passed in settings object to jToxKit.init(), or as data-XXX - with the same names. Values set here are the defaults.
	*/
	settings: {
  	jsonp: false,					// whether to use JSONP approach, instead of JSON.
  	baseUrl: null,					// the server actually used for connecting. Part of settings. If not set - attempts to get 'baseUrl' parameter of the query, if not - get's current server.
  	timeout: 15000,				// the timeout an call to the server should be wait before the attempt is considered error.
  	pollDelay: 200,				// after how many milliseconds a new attempt should be made during task polling.
  	onConnect: function(s){ },		    // function (service): called when a server request is started - for proper visualization. Part of settings.
  	onSuccess: function(c, m) { },		// function (code, mess): called on server request successful return. It is called along with the normal processing. Part of settings.
  	onError: function (c, m) { },			// function (code, mess): called on server reques error. Part of settings.
  },
	
	// some handler functions that can be configured from outside with the settings parameter.
    
	init: function() {
  	var self = this;
  	
  	self.initTemplates();

    // scan the query parameter for settings
		var url = ccLib.parseURL(document.location);
		var queryParams = url.params;
		queryParams.host = url.host;
	
    self.settings = $.extend(self.settings, queryParams); // merge with defaults
	  
		if (!self.settings.baseUrl)
		  self.settings.baseUrl = self.settings.host;
	  
  	// now scan all insertion divs
  	$('.jtox-toolkit').each(function(i) {
    	var dataParams = $(this).data();
    	if (!dataParams.manualInit){
    	  // initializes the kit, based on the passed kit name
      	if (dataParams.kit == "study")
      	  new jToxStudy(this, dataParams);
      }
  	});
	},
	
	initTemplates: function() {
	  var self = this;

    var root = document.getElementsByClassName('jtox-template')[0];
    if (root === undefined) {
  	  var html = '';
    	for (var t in self.templates) {
      	html += self.templates[t];
    	}
    	
    	root = document.createElement('div');
    	root.className = 'jtox-template';
    	root.innerHTML = html;
    	document.body.appendChild(root);
    }
    
  	self.templateRoot = root;
	},
	
	getTemplate: function(selector) {
  	var el = $(selector, this.templateRoot)[0];
  	if (!!el){
    	var el = $(selector, this.templateRoot)[0].cloneNode(true);
      el.removeAttribute('id');
    }
    return el;
	},
		
  changeTabsIds: function (root, suffix) {
    $('ul li a', root).each(function() {
      var id = $(this).attr('href').substr(1);
      var el = document.getElementById(id);
      id += suffix;
      el.id = id;
      $(this).attr('href', '#' + id);
    })  
  },
		
	/* Poll a given taskId and calls the callback when a result from the server comes - 
	be it "running", "completed" or "error" - the callback is always called.
	*/
	pollTask : function(task, callback) {
		var self = this;
		if (task === undefined || task.task === undefined || task.task.length < 1){
		  ccLib.fireCallback(self.settings.onError, self, '-1', localMessage.taskFailed);
			return;
		}
		task = task.task[0];
		if (task.completed == -1){ // i.e. - running
			setTimeout(function(){
				self.call(task.result, function(newTask){
					self.pollTask(newTask, callback);
				});
			}, self.pollDelay);
		}
		else if (!task.error){
			callback(task.result);
		}
		else { // error
		  ccLib.fireCallback(self.settings.onError, self, '-1', task.error);
		}
	},
	
	/* Deduce the baseUrl from a given Url - either if it is full url, of fallback to jToxKit's if it is local
	Passed is the first "non-base" component of the path...
	*/
	grabBaseUrl: function(url, main){
    if (url !== undefined && url != null && url.indexOf('http') == 0) {
      var re = new RegExp("(.+\/)" + main + ".*");
      return url.replace(re, "$1");
    }
    else
      return this.settings.baseUrl;
	},
	
	/* Makes a server call with the provided method. If none is given - the internally stored one is used
	*/
	call: function (kit, service, callback, adata){
		if (kit == null)
		  kit = this;
		  
		ccLib.fireCallback(kit.settings.onConnect, kit, service);
		  
		var method = 'GET';
		var accType = kit.settings.jsonp ? "application/x-javascript" : "application/json";	
		
		if (adata !== undefined){
			method = 'POST';
			if (typeof adata == "boolean")
				adata = {};
		}
		else
			adata = { };

		// on some queries, like tasks, we DO have baseUrl at the beginning
		if (service.indexOf("http") != 0)
			service = (!!kit.settings.baseUrl ? kit.settings.baseUrl : this.settings.baseUrl) + service;
			
		// now make the actual call
		$.ajax(service, {
			dataType: kit.settings.jsonp ? 'jsonp' : 'json',
			headers: { Accept: accType },
			crossDomain: true,
			timeout: kit.settings.timeout,
			type: method,
			data: adata,
			jsonp: kit.settings.jsonp ? 'callback' : false,
			error: function(jhr, status, error){
			  ccLib.fireCallback(kit.settings.onError, kit, status, error);
				callback(null);
			},
			success: function(data, status, jhr){
			  ccLib.fireCallback(kit.settings.onSuccess, kit, status, jhr.statusText);
				callback(data);
			}
		});
	}
};

$(document).ready(function(){
  jToxKit.init();
});