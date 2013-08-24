/* 
	ToxMan.js - ToxMan JavaScript query helper.
	Created by Ivan Georgiev, 2013.
	
	

*/

window.ToxMan = {
	currentQuery: null,
	currentDataset: null,
	algorithms: null, // it gets filled from the listAlgos() query.

	/* The following parametes can be passed in settings object to ToxMan.init() - with the same names
	*/
	method: 'GET',							// the prefered HTTP method. Part of settings.
	prefix: 'ToxMan',						// the default prefix for elements, when they are retrieved from the DOM. Part of settings.
	media: 'application/json',	// the prefered media for receiving result. Setnt as 'Accept' header on requests. Part of settings.
	
	// some handler functions that can be configured from outside
	onalgoadd: null,		// function (row, idx): called when each row for algorithm is added. idx is it's index in this.algorithms. Part of settings.
	onrun: null,				// function (row, e): called within click hander for run prediction button. 'e' is the original event. Part of settings.
	onsuccess: null,		// function (code, mess): called on server request successful return. Part of settings.
	onerror: null,			// function (code, mess): called on server reques error. Part of settings.
	
	// Some elements from the DOM which we use - remember them here upon init. Part of settings.
	elements: {
		featureList: null, 		// the whole container (table) for feature list
		featureRow: null,			// a single, template, row for filling the above
		featureHeader: null,  // a single row, as above, with textual header information
		diagramImage: null,		// the placeholder for the compund image
		algoList: null,				// the container (table) for algorithms list
		algoRow: null,				// a single, template, row for filling the above
	},
	
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

	featurePrefix: 'http://www.opentox.org/api/1.1#',
	categoryRegex: /\^\^(\S+)Category/i,
		
	/* Initializes the ToxMan, setting up all elements, if not passed, that are going to be used, so it
	need to be called when the DOM is ready.
	*/
	init : function(settings) {
		if (!settings)
			settings = { elements: { } };
		else if (settings.elements === undefined)
			settings.elements = {};
			
		var prefix = this.prefix;
		if (settings.prefix)
			prefix = this.prefix = settings.prefix;
			
		var featureList = settings.elements.featureList;
		if (!featureList)
			featureList = document.getElementsByClassName(prefix + '-features')[0];
			
		if (featureList){
			this.elements.featureRow = featureList.getElementsByClassName('row-blank')[0];
			this.elements.featureHeader = featureList.getElementsByClassName('header-blank')[0];
			this.elements.featureList = featureList.classList.contains('body') ? featureList : featureList.getElementsByClassName('body')[0];
		}
		
		this.elements.diagramImage = settings.elements.diagramImage;
		if (!this.elements.diagramImage)
			this.elements.diagramImage = document.getElementsByClassName(prefix + '-diagram')[0];
		
		var algoList = settings.elements.algoList;
		if (!algoList)
			algoList = document.getElementsByClassName(prefix + '-algorithms')[0];
		if (algoList){
			this.elements.algoRow = algoList.getElementsByClassName('row-blank')[0];
			this.elements.algoList = algoList.classList.contains('body') ? algoList : algoList.getElementsByClassName('body')[0];
		}
		
		this.onalgoadd = settings.onalgoadd;
		this.onrun = settings.onrun;
		ConnMan.init();
	},
	
	/* Clear all results that appera on the page - features, diagrams, prediction results - all.
	*/
	clearResults : function() {
		// clear features and diagrams first
		var elements = this.elements;
		if (elements.diagramImage)
			elements.diagramImage.style.visibility = 'hidden';
		if (elements.featureList)
			clearChildren(elements.featureList, elements.featureRow.parentNode == elements.featureList ? elements.featureRow : null);
		
		// now go with the predictions
	},
	
	/* Makes a query for dataset based on a needle - the starting point of all actions.
	*/
	query : function(needle) {
		if (needle.length < 1)
			return false;
		var self = this;
		this.currentQuery = formatString(this.queries.query, encodeURIComponent(needle)); // TODO: encode it?
		ConnMan.call(this.currentQuery, function(dataset){
			// start with some clearing
			self.clearResults();
			if (!dataset || dataset.dataEntry.length < 1){
				ConnMan.setResult('notfound', localMessage.nothingFound);
				return false;
			}
			// now parse to see the compund ID
			dataset.dataEntry[0].compound.id = parseInt(dataset.dataEntry[0].compound.URI.replace(/.*compound\/(\d+)\/.*/, '$1'));
			self.currentDataset = dataset;
			
			// fills the feature list...
			self.addFeatures(self.buildFeatures(dataset, 0));
	
			// ... and setup the diagram image
			var image = self.elements.diagramImage;
			if (image){
				image.style.visibility = 'visible';
				image.src = dataset.dataEntry[0].compound.URI + '?media=image/png';
			}
			
			self.runAutos();
		});
	},
	
	/* Retrieves the model description for given algorithm. Used from both listAlgos() and runPrediction()
	*/
	getModel: function(algo, callback){
		var q = formatString(this.queries.getModel, encodeURIComponent(algo.uri));
		ConnMan.call(q, function(model){
			if (!model || model.model.length < 1){
				ConnMan.post(self.queries.postModel, data, function(task){
					self.pollTask(task, function(ready){
						self.getModel(algo, callback);
					});					
				});
			}
			else { // OK, we have the model - attempt to get a prediction for our compound...
				callback(model);
			}
		});
	},
	
	/* Queries the server for list of all supported algorithms. The corresponding place in the UI is filled with the
	results, all necessary 'run', 'auto', etc. buttons are configured too.
	*/
	listAlgos : function() {
		var self = this;
		ConnMan.call(this.queries.listAlgos, function(algos){
			if (!algos) // i.e. error
				return false;
			var root = self.elements.algoList;
			var tempRow = self.elements.algoRow;
			
			algos = algos.algorithm;
			self.algorithms = algos;
			if (!root || !tempRow)
				return false;
			
			clearChildren(root, tempRow.parentNode == root ? tempRow : null);
			for (var i = 0;i < algos.length; ++i) {
				var row = tempRow.cloneNode(true);
				algos[i].name = algos[i].name.substr(self.prefix.length + 2);
				fillTree(row, algos[i], self.prefix + '-algo-');
				
				// after the row is filled with data
				row.classList.remove('template');
				row.classList.remove('row-blank');
				root.appendChild(row);
				self.onalgoadd(row, i);

				// finally - attach the handler for running the prediction - create a new function each time so the proper index to be passed
				var run = row.querySelector('.run');
				run.onclick = (function(algoIdx, row){
					return function(e){
						self.runPrediction(algoIdx);
						if (self.onrun)
							self.onrun(row, e);
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
		
		var self = this;
		
		// the function that actually parses the results of predictions and fills up the UI
		var predictParser = function(prediction){
			var features = self.buildFeatures(prediction, 0);
			self.addFeatures(features, algo.name, algo.id, function(feature){
				return res = feature.name.indexOf('#explanation') == -1;
			});

			// now ask for categories, used as a summary ...
			var categories = self.buildCategories(features);
			
			// ... and fill them up in the interface.
			var resRoot = mainRow.getElementsByClassName('result')[0];
			var resTemp = resRoot.getElementsByClassName('row-blank')[0];
			clearChildren(resRoot, resTemp.parentNode == resRoot ? resTemp : null);
			var frag = document.createDocumentFragment();
			for (var i = 0;i < categories.length; ++i){
				var row = resTemp.cloneNode(true);
				fillTree(row, categories[i]);
				row.classList.remove('template');
				row.classList.remove('row-blank');
				row.classList.add(categories[i].toxicity);
				if (categories[i].active)
					row.classList.add('active');
				frag.appendChild(row);
			}
			resRoot.appendChild(frag);
			
			// now mark the whole stuff as predicted
			mainRow.classList.add('predicted');
			var expFeature = features.filter(function(feat){ return feat.name.indexOf('#explanation') > -1; })[0];
			if (expFeature)
				explain.innerHTML = expFeature.value;
		};
		
		// the prediction invoke trickery...
		this.getModel(algo, function(model){
			var q = formatString(self.queries.getPrediction, encodeURIComponent(self.currentDataset.dataEntry[0].compound.id), encodeURIComponent(model.model[0].predicted));
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
	
	/* This one build a category list from the feature list, built on the previous step. It returns a list, 
	which contains all possible categories along with their toxicity class, id, whether it's active, etc.
	*/
	buildCategories: function(features){
		var cats = [];
		features = features.filter(function(feat){
			return feat.annotation.length > 0 && feat.annotation[0].o !== undefined && feat.name.indexOf('#explanation') == -1;
		});
		
		if (features.length == 1){ // the "normal" case
			var anot = features[0].annotation;
			for (var i = 0; i < anot.length; ++i)
				cats.push({
					id: features[0].id,
					name: anot[i].o,
					toxicity: anot[i].type.replace(this.categoryRegex, '$1').toLowerCase(),
					active: anot[i].o == features[0].value
				});
		}
		else {
			for (var i = 0;i < features.length;++i){
				var anot = features[i].annotation;
				var toxic = "";
				for (var j = 0;j < anot.length; ++j)
					if (anot[j].o == features[i].value){
						toxic = anot[j].type.replace(this.categoryRegex, '$1').toLowerCase();
						break;
					}
				cats.push({
					id: features[i].id,
					name: features[i].name,
					toxicity: toxic,
					active: true,
				});
			}
		}
		
		return cats;
	},
	
	/* Adds given features (the result of buildFeatures call) to the feature list. If header is passed
	 one single header row is added with the given string
	*/
	addFeatures : function (features, header, classadd, filter) {
		// proceed on filling the feature windows
		var root = this.elements.featureList;
		var tempRow = this.elements.featureRow;

		if (!root || !tempRow)
			return false;
		
		var list = document.createDocumentFragment();
		
		// add a header row, if asked to do so.
		if (header){
			var hdr = this.elements.featureHeader.cloneNode(true);
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
			row.classList.remove('row-blank');
			list.appendChild(row);
		}
		
		// finalize by adding this to the root.
		root.appendChild(list);
	},
	
	/* Poll a given taskId and calls the callback when a result from the server comes - 
	be it "running", "completed" or "error" - the callback is always called.
	*/
	pollTask : function(taskId, callback) {
		
	},
	
	/* Makes a server call with the provided method. If none is given - the internally stored one is used
	*/
	call: function (service, callback){
		
	}
};

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

