window.jToxKit = {
	templateRoot: null,
	server: null,

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
  	server: null,					// the server actually used for connecting. Part of settings. If not set - attempts to get 'server' parameter of the query, if not - get's current server.
  	timeout: 5000,				// the timeout an call to the server should be wait before the attempt is considered error.
  	pollDelay: 200,				// after how many milliseconds a new attempt should be made during task polling.
  },
	
	// some handler functions that can be configured from outside with the settings parameter.
	onconnect: function(s){ },		    // function (service): called when a server request is started - for proper visualization. Part of settings.
	onsuccess: function(c, m) { },		// function (code, mess): called on server request successful return. It is called along with the normal processing. Part of settings.
	onerror: function (c, m) { },			// function (code, mess): called on server reques error. Part of settings.
  
  mergeSettings: function (settings) {
    if (settings !== undefined)
    	for (var s in settings)
      	this.settings[s] = settings[s];
  },
  
	init: function(settings) {
  	var self = this;
  	
  	self.initTemplates();

    // scan the query parameter for settings
		var url = ccLib.parseURL(document.location);
		var queryParams = url.params;
		queryParams.host = url.host;
  	
  	// now scan all insertion divs
  	if (!settings) {
    	$('.jtox-toolkit').each(function(i) {
      	var dataParams = $(this).data();
      	if (!dataParams.manualInit || settings !== undefined){
          // this order determines the priority..
          self.mergeSettings(dataParams);
          self.mergeSettings(queryParams);
          self.mergeSettings(settings);
          
        	if (self.settings.kit == "study")
        	  jToxStudy.init(this, self.settings);
        }
    	});
  	}

  	self.initConnection();
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
		
	/* Poll a given taskId and calls the callback when a result from the server comes - 
	be it "running", "completed" or "error" - the callback is always called.
	*/
	pollTask : function(task, callback) {
		var self = this;
		if (task === undefined || task.task === undefined || task.task.length < 1){
			self.onerror('-1', localMessage.taskFailed);
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
			self.onerror('-1', task.error);
		}
	},
	
	/* Initialized the necessary connection data. Same settings as in ToxMan.init() are passed.
	*/
	initConnection: function(){
	  var settings = this.settings;
		if (!settings.server) {
		  settings.server = settings.host;
		}
		  
		this.server = settings.server;
					
    if (settings.onerror !== undefined)
		  this.onerror = settings.onerror;
		if (settings.onsuccess !== undefined)
		  this.onsuccess = settings.onsuccess;
		if (settings.onconnect !== undefined)
		  this.onconnect = settings.onconnect;
	},
	
	/* Makes a server call with the provided method. If none is given - the internally stored one is used
	*/
	call: function (service, callback, adata){
		var self = this;
		self.onconnect(service);
		var method = 'GET';
		var accType = self.jsonp ? "application/x-javascript" : "application/json";	
		
		if (adata !== undefined){
			method = 'POST';
			if (typeof adata == "boolean")
				adata = {};
		}
		else
			adata = { };

		// on some queries, like tasks, we DO have server at the beginning
		if (service.indexOf("http") != 0)	
			service = self.server + service;
		// now make the actual call
		$.ajax(service, {
			dataType: self.jsonp ? 'jsonp' : 'json',
			headers: { Accept: accType },
			crossDomain: true,
			timeout: self.timeout,
			type: method,
			data: adata,
			jsonp: self.jsonp ? 'callback' : false,
			error: function(jhr, status, error){
				self.onerror(status, error);
				callback(null);
			},
			success: function(data, status, jhr){
				self.onsuccess(status, jhr.statusText);
				callback(data);
			}
		});
	}
};

$(document).ready(function(){
  jToxKit.init();
});
