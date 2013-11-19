window.jToxKit = {
	queryParams: null,				// an associative array of parameters supplied on the query. Some things like 'language' can be retrieved from there.
	templateRoot: null,
	server: null,

	/* A single place to hold all necessary queries. Parameters are marked with <XX> and formatString() (common.js) is used
	to prepare the actual URLs
	*/
	queries: {
		taskPoll: "/task/<1>",
	},

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
  
	init: function(settings) {
  	var self = this;
  	
  	self.templateRoot = document.getElementById('jtox-template');
  	// no configuration
  	if (!settings) {
    	$('.jtox-toolkit').each(function(i) {
      	settings = $(this).data();
      	if (settings.kit == "study")
      	  jToxStudy.init(this, self.settings);
    	});
  	}
  	for (var s in settings)
    	self.settings[s] = settings[s];

  	self.initConnection(self.settings);
	},
	
	getTemplate: function(selector) {
  	var el = $(selector, this.templateRoot)[0].cloneNode(true);
    el.removeAttribute('id');
    return el;
	},
	
	/* formats a string, replacing [<number>] in it with the corresponding value in the arguments
  */
  formatString: function(format) {
    for (var i = 1;i < arguments.length; ++i) {
      format = format.replace('<' + i + '>', arguments[i]);
    }
    return format;
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
	initConnection: function(settings){
		if (!settings.server){
			var url = this.parseURL(document.location);
			this.queryParams = url.params;
			var server = url.params.server;
			if (!server)
				server = url.host;
			this.server = server;
		}
		else
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
  jToxStudy.querySummary("test");
});
