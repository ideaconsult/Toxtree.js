/* 
	connection.js - A connection manager capable of sending XHRs waiting for them and reporting the result on error

*/

window.ConnMan = {
	errorHandler: null,
	baseURI: null,
	timeoutSecs: 10,
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
		
		if (!baseUri){
			// TODO: get the calling server URL and append the passed ?serviceRoot=<root> path			
		}
		else
			this.baseURI = baseUri;
			
		this.elements.server = document.getElementById('connection-baseuri');
		this.elements.status = document.getElementById('connection-status');
		this.elements.error = document.getElementById('connection-error');
		
		setObj(this.elements.server, this.baseURI);
	},
	
	/* Make the actual HTTPRequest to the server. Creates s new object, fills in the passed data, callback, etc.
		setups all necessary handlers and voilah - go to the server. The callback will be called on success only.
	*/
	makeXHR: function(method, address, callback, data){
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
	    callback(request.responseText);
		};

		xhr.onerror = function () {
	    if(finished)return;
	    finished = true;
	    clearTimeout(requestTimeout);
			connectionError(xhr.errorCode, xhr.errorMessage);
		};

		try
		{
			request.open(method, this.baseURI + url, true);
			request.send(data);
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
		this.elements.status.src = "images/" + status + ".png";
		if (!error)
			error = '';
		this.elements.error.innerHTML = error;
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