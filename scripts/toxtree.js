/* 
	ToxMan.js - ToxMan JavaScript query helper.
	Created by Ivan Georgiev, 2013.
	
	

*/

window.ToxMan = {
	currentQuery: null,
	currentDataset: null,
	algorithms: null, // it gets filled from the listAlgos() query.

	prefix: 'ToxMan',
	featurePrefix: 'http://www.opentox.org/api/1.1#',
	categoryRegex: /\^\^(\S+)Category/i,
	
	/* A single place to hold all necessary queries. Parameters are marked with <XX> and formatString() (common.js) is used
	to prepare the actual URLs
	*/
	queries: {
		query: "/query/compound/search/all?search=<1>&page=0&pagesize=1",
		listAlgos: "/algorithm?search=ToxTree",
		taskPoll: "/task/<1>",
		getModel: "/model?algorithm=<1>",
		postModel: "",
		getPrediction: "/compound/<1>?feature_uris[]=<2>",
		postPrediction: ""
	},
	
	/* Some elements from the DOM which we use - remember them here upon init
	*/
	elements: {
		featureList: null, 		// the whole container (table) for feature list
		featureRow: null,			// a single, template, row for filling the above
		featureHeader: null,  // a single row, as above, with textual header information
		featureImage: null,		// the placeholder for the compund image
		algoList: null,				// the container (table) for algorithms list
		algoRow: null,				// a single, template, row for filling the above
	},
	
	/* Initializes the ToxMan, setting up all elements, if not passed, that are going to be used, so it
	need to be called when the DOM is ready.
	*/
	init : function(prefix, elements) {
		if (prefix)
			this.prefix = prefix;
		else
			prefix = this.prefix;
			
		var featureList = document.getElementsByClassName(prefix + '-features')[0];
		if (featureList){
			this.elements.featureRow = featureList.getElementsByClassName('row-blank')[0];
			this.elements.featureHeader = featureList.getElementsByClassName('header-blank')[0];
			this.elements.featureList = featureList.classList.contains('body') ? featureList : featureList.getElementsByClassName('body')[0];
		}
		this.elements.featureImage = document.getElementsByClassName(prefix + '-diagram')[0];
		
		var algoList = document.getElementsByClassName(prefix + '-algorithms')[0];
		if (algoList){
			this.elements.algoRow = algoList.getElementsByClassName('row-blank')[0];
			this.elements.algoList = algoList.classList.contains('body') ? algoList : algoList.getElementsByClassName('body')[0];
		}
	},
	
	/* Clear all results that appera on the page - features, diagrams, prediction results - all.
	*/
	clearResults : function() {
		// clear features and diagrams first
		var elements = this.elements;
		if (elements.featureImage)
			elements.featureImage.style.visibility = 'hidden';
		if (elements.featureList)
			clearChildren(elements.featureList, elements.featureRow.parentNode == elements.featureList ? elements.featureRow : null);
		
		// now go with the predictions
	},
	
	/* Makes a query for dataset based on a needle - the starting point of all actions.
	*/
	query : function(needle) {
		if (needle.length < 1)
			return false;
		this.currentQuery = formatString(this.queries.query, encodeURIComponent(needle)); // TODO: encode it?
		ConnMan.call(this.currentQuery, function(dataset){
			// start with some clearing
			ToxMan.clearResults();
			if (!dataset || dataset.dataEntry.length < 1){
				ConnMan.setResult('notfound', localMessage.nothingFound);
				return false;
			}
			// now parse to see the compund ID
			dataset.dataEntry[0].compound.id = parseInt(dataset.dataEntry[0].compound.URI.replace(/.*compound\/(\d+)\/.*/, '$1'));
			ToxMan.currentDataset = dataset;
			
			// fills the feature list...
			ToxMan.addFeatures(ToxMan.buildFeatures(dataset, 0));
	
			// ... and setup the diagram image
			var image = ToxMan.elements.featureImage;
			if (image){
				image.style.visibility = 'visible';
				image.src = dataset.dataEntry[0].compound.URI + '?media=image/png';
			}
			
			ToxMan.runAutos();
		});
	},
	
	/* Retrieves the model description for given algorithm. Used from both listAlgos() and runPrediction()
	*/
	getModel: function(algo, callback, post){
		var q = formatString(this.queries.getModel, encodeURIComponent(algo.uri));
		ConnMan.call(q, function(model){
			if (!model || model.model.length < 1){
				if (post)
					ToxMan.getModel(algo, callback, true);
			}
			else { // OK, we have the model - attempt to get a prediction for our compound...
				callback(model);
			}
		});
	},
	
	/* Queries the server for list of all supported algorithms. The corresponding place in the UI is filled with the
	results, all necessary 'run', 'auto', etc. buttons are configured too.
	*/
	listAlgos : function(onclick, onrun) {
		ConnMan.call(this.queries.listAlgos, function(algos){
			if (!algos) // i.e. error
				return false;
			var root = ToxMan.elements.algoList;
			var tempRow = ToxMan.elements.algoRow;
			
			algos = algos.algorithm;
			ToxMan.algorithms = algos;
			if (!root || !tempRow)
				return false;
			
			clearChildren(root, tempRow.parentNode == root ? tempRow : null);
			for (var i = 0;i < algos.length; ++i) {
				var row = tempRow.cloneNode(true);
				algos[i].name = algos[i].name.substr(ToxMan.prefix.length + 2);
				fillTree(row, algos[i], ToxMan.prefix + '-algo-');
				
				// after the row is filled with data
				row.classList.remove('template');
				root.appendChild(row);

				row.getElementsByClassName('show-hide')[0].onclick = onclick;
				
				// then put good id to auto checkboxes so that runAutos() can recognizes
				var auto = row.getElementsByClassName('auto')[0].id = ToxMan.prefix + "-auto-" + i;

				// finally - attach the handler for running the prediction - create a new function each time so the proper index to be passed
				var run = row.querySelector('.run');
				run.onclick = (function(algoIdx, row){
					return function(e){
						ToxMan.runPrediction(algoIdx);
						if (onrun)
							onrun(row, e);
					}
				})(i, row);
			}
		});
	},
	
	/* Runs a prediction (algorithm) with given 'algo' (as reported upon listAlgos()) on the compound form the current dataset. 'algoId' is used to determine
		which element in the UI should be filled, so that results can be shown later.
	*/
	runPrediction : function (algoIndex) {
		var algo = this.algorithms[algoIndex];
		
		// let's clean a bit - the trick is we've added class='<algo.id>' on every feature row concerning this algorithm
		var features = this.elements.featureList.getElementsByClassName(algo.id);
		while(features.length > 0)
			features[0].parentNode.removeChild(features[0]);
			
		// clear the previous prediction results.
		var mainRow = document.getElementById(ToxMan.prefix + '-algo-' + algo.id);
		var explain = mainRow.getElementsByClassName('explanation')[0];
		mainRow.classList.remove('predicted');
		explain.innerHTML = '';		
		
		// the function that actually parses the results of predictions and fills up the UI
		var predictParser = function(prediction){
			var features = ToxMan.buildFeatures(prediction, 0);
			var theFeature = null;
			var expFeature = null;
			ToxMan.addFeatures(features, algo.name, algo.id, function(feature){
				var res = feature.name.indexOf('#explanation') == -1;
				if (res)
					theFeature = feature;
				else
					expFeature = feature;
				return res;
			});

			// now fill the categorization 
			var resRoot = mainRow.getElementsByClassName('result')[0];
			var resTemp = resRoot.getElementsByClassName('row-blank')[0];
			if (resTemp){ // it is the very first time.
				resTemp.parentNode.removeChild(resTemp);
				resTemp.classList.remove('template');
				
				var annot = theFeature.annotation;
				var frag = document.createDocumentFragment();
				for (var i = 0;i < annot.length; ++i){
					var row = resTemp.cloneNode(true);
					fillTree(row, annot[i]);
					row.classList.remove('template');
					row.classList.add(annot[i].type.replace(ToxMan.categoryRegex, '$1').toLowerCase());
					if (annot[i].o == theFeature.value)
						row.classList.add('active');
					frag.appendChild(row);
				}
				resRoot.appendChild(frag);
			}
			else { // we only need to set it up...
				
			}
			
			// now mark the whole stuff as predicted
			mainRow.classList.add('predicted');
			explain.innerHTML = expFeature.value;
		};
		
		// the prediction invoke trickery...
		this.getModel(algo, function(model){
			var q = formatString(ToxMan.queries.getPrediction, encodeURIComponent(ToxMan.currentDataset.dataEntry[0].compound.id), encodeURIComponent(model.model[0].predicted));
			ConnMan.call(q, predictParser);	
		});
	},
	
	/* Run predictions that are marked as 'auto'. Rely on the properly set id of each row in the algorithms list
	*/
	runAutos: function() {
		var autos = document.querySelectorAll('.' + this.prefix + '-algorithms .auto');
		for (var i = 0;i < autos.length; ++i){
			if (autos[i].id.length > 0 && autos[i].checked){
				this.runPrediction(parseInt(autos[i].id.substr(this.prefix.length + 6)));
			}
		}	
	},
	
	/* Build a new array of features from 'values' and 'feature' arrays in the dataset. 
		The resulting array has {id, name, value} properties for each feature.
	*/
	buildFeatures : function(dataset, index) {
		var features = [];
		for (var i in dataset.dataEntry[index].values){
			var entry = new Object();
			entry.id = i;
			entry.value = dataset.dataEntry[index].values[i];
			entry.name = dataset.feature[i].title.replace(this.featurePrefix, "");
			entry.annotation = dataset.feature[i].annotation;
			features.push(entry);
		}
		
		return features;
	},
	
	/* Adds given features (the result of buildFeatures call) to the feature list. If header is passed
	 one single header row is added with the given string
	*/
	addFeatures : function (features, header, classadd, filter) {
		// proceed on filling the feature windows
		var root = ToxMan.elements.featureList;
		var tempRow = ToxMan.elements.featureRow;

		if (!root || !tempRow)
			return false;
		
		var list = document.createDocumentFragment();
		
		// add a header row, if asked to do so.
		if (header){
			var hdr = ToxMan.elements.featureHeader.cloneNode(true);
			if (classadd)
				hdr.classList.add(classadd);
			fillTree(hdr, {"header": header});
			list.appendChild(hdr);
		}
		
		// now fill the features' key:value pairs.
		for (var i = 0;i < features.length; ++i) {
			if (filter && !filter(features[i]))
				continue;
			var row = tempRow.cloneNode(true);
			if (classadd)
				row.classList.add(classadd);
			fillTree(row, features[i]);
			row.classList.remove('template');
			list.appendChild(row);
		}
		
		// finalize by adding this to the root.
		root.appendChild(list);
	},
	
	formClass: function(val){
		return val.replace(' ', '_');
	},
	
	/* Poll a given taskId and calls the callback when a result from the server comes - 
	be it "running", "completed" or "error" - the callback is always called.
	*/
	pollTask : function(taskId, callback) {
		
	},
};

function formatCategory(val){
	return val.replace(ToxMan.categoryRegex, '$1');	
}

window.languages = {
	en : {
		timeout: "Request timeout reached!",
		nothingFound: "No compound with this name is found!",
		ok: "Success",
		error: "Error: ",
		notfound: "Not found!",
		waiting: "Waiting for server response...",
	}
}

var localMessage = languages.en;

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
			connectionError(this.status, this.statusText);
		};

		// some nices...
		this.elements.status.src = "images/waiting_small.gif";
		this.elements.status.title = localMessage.waiting;

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
			connectionError(xhr.status, xhr.statusText);
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
		if (this.elements.status){
			this.elements.status.src = "images/" + status + ".png";
			this.elements.status.title = localMessage[status];
		}
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

