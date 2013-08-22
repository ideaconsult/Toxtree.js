/* 
	connection.js - A connection manager capable of sending XHRs waiting for them and reporting the result on error

*/

window.ConnMan = {
	errorHandler: null,
	baseURI: null,
	timeoutSecs: 10,
	parameters:null, // the parameters from the query - as they appera in the URL
	fadeTimeout: null,
	elements: {
		server: null,
		status: null,
		error: null
	},
	
	/* Initialize the basics: URI, error handling callbacks, status reporting elements, etc.
	*/
	init : function(errHandler, baseUri) {
	if (!errHandler){
		this.errorHandler = function(code, mess){
			window.ConnMan.defaultErrorHnd(code, mess);
			}
		}
		else
			this.errorHandler = errHandler;
		
		var url = parseURL(document.location);
		this.parameters = url.params;
		if (!baseUri)
			this.baseURI = url.params.server;		
		else
			this.baseURI = baseUri;
			
		this.elements.server = document.getElementById('connection-baseuri');
		this.elements.status = document.getElementById('connection-status');
		this.elements.error = document.getElementById('connection-error');
		
		if (this.elements.server)
			setObjValue(this.elements.server, this.baseURI);
	},
	
	/* Make the actual HTTPRequest to the server. Creates s new object, fills in the passed data, callback, etc.
		setups all necessary handlers and voilah - go to the server. The callback will be called in either way - 
		success or error, with the later case passing 'null'.
	*/
	makeXHR: function(method, url, callback, data){
	  var xhr = new XMLHttpRequest();
	  if ("withCredentials" in xhr) {
	    // Check if the XMLHttpRequest object has a "withCredentials" property.
	    // "withCredentials" only exists on XMLHTTPRequest2 objects.
	  } else if (typeof XDomainRequest != "undefined") {
	    // Otherwise, check if XDomainRequest.
	    // XDomainRequest only exists in IE, and is IE's way of making CORS requests.
	    xhr = new XDomainRequest();
	  } else {
	    // Otherwise, CORS is not supported by the browser.
	    throw new Error("The browser does not support cross-origin XMLHttpRequest.");
	  }

		var finished = false;
		var requestTimeout = setTimeout(
			function() {
				if(finished) return;
				finished = true;
				connectionError(0, localMessage.timeout);
			},
			this.timeoutSecs * 1000);

		xhr.onload = function () {
	    if(finished) return;
	    finished = true;
	    clearTimeout(requestTimeout);
	    ConnMan.setResult('ok');
	    callback(JSON.parse(xhr.responseText));
		};

		xhr.onerror = function () {
	    if(finished)return;
	    finished = true;
	    clearTimeout(requestTimeout);
	    callback(null);
			connectionError(xhr.errorCode, xhr.errorMessage);
		};

		try
		{
			xhr.open(method, this.baseURI + url, true);
			xhr.setRequestHeader("Accept", "application/json");
			xhr.send(data);
		}
		catch(e)
		{
			if(finished)return;
			finished = true;
			clearTimeout(requestTimeout);
			connectionError(xhr.errorCode, xhr.errorMessage);
		}
	},
	
	/* Make a normal GET call for the given server (along with parameteres, they must be encoded...). Uses makeXHR.
	*/
	call : function(service, callback) {
		this.makeXHR('GET', service, callback, null);	
	},
	
	/* Prepares the necessary formdata and makes a POST request (using makeXHR again) to the server.
	*/
	post : function(service, callback, parameters) {
		var data;
		// TODO: pack parameters into data for the callback
		this.makeXHR('GET', service, callback, data);	
	},
	
	/* Set the result from the request - be it success or error
	*/
	setResult: function(status, error){
		if (this.elements.status)
			this.elements.status.src = "images/" + status + ".png";
		if (!error)
			error = '';
		if (this.elements.error){
			var errEl = this.elements.error;
			errEl.classList.remove('fading');
			errEl.innerHTML = error;
			if (this.fadeTimeout)
				clearTimeout(this.fadeTimeout);
			this.fadeTimeout = setTimeout(function() { errEl.classList.add('fading'); }, 200);
		}
	},
	
	/* The default error handling routing, if no other is passed on ConnMan.init() - this one is used.
	*/
	defaultErrorHnd : function(code, mess) {
		this.setResult('error', "(" + code + "): " + mess);
	}
};

function connectionError(code, mess){
	ConnMan.errorHandler(code, mess);
}