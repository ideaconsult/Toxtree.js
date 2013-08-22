/* 
	ToxMan.js - ToxMan JavaScript query helper

*/

window.ToxMan = {
	currentQuery: null,
	currentDataset: null,
	prefix: 'ToxMan',
	algorithms: null, // it gets filled from the listAlgos() query.
	featurePrefix: 'http://www.opentox.org/api/1.1#',
	
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
	
	/* Initializes the ToxMan, setting up all elements, that are going to be used, so it
	need to be called whtn the DOM is ready.
	*/
	init : function(prefix) {
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
			clearChildren(elements.featureList);
		
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
	
	/* Queries the server for list of all supported algorithms. The corresponding place in the UI is filled with the
	results, all necessary 'run', 'auto', etc. buttons are configured too.
	*/
	listAlgos : function() {
		ConnMan.call(this.queries.listAlgos, function(algos){
			if (!algos) // i.e. error
				return false;
			var root = ToxMan.elements.algoList;
			var tempRow = ToxMan.elements.algoRow;
			
			algos = algos.algorithm;
			ToxMan.algorithms = algos;
			if (!root || !tempRow)
				return false;
			
			clearChildren(root, tempRow);
			for (var i = 0;i < algos.length; ++i) {
				var row = tempRow.cloneNode(true);
				fillTree(row, algos[i], ToxMan.prefix + '-algo-');
				
				// after the row is filled with data - make the default screening - detailed info and results are invisible
				row.classList.remove('template');
				var info = row.getElementsByClassName('info')[0];
				var res = row.getElementsByClassName('results')[0];
				if (info)
					info.classList.add('invisible');
				if (res)
					res.classList.add('invisible');
				root.appendChild(row);

				// now attach the handler for clicking on the line which opens / hides it.
				var showhideInfo = function(row){
					var info = row.getElementsByClassName('info')[0];
					var res = row.getElementsByClassName('results')[0];
					if (row.classList.contains('visible')){
						row.classList.remove('visible');
						if (info)
							info.classList.add('invisible');
					}
					else {
						row.classList.add('visible')
						if (info)
							info.classList.remove('invisible');
					}
				}
				
				row.getElementsByClassName('title')[0].onclick = function(e) { showhideInfo(this.parentNode); }
				
				// then put good id to auto checkboxes so that runAutos() can recognizes
				var auto = row.getElementsByClassName('auto')[0].id = ToxMan.prefix + "-algoauto-" + i;

				// finally - attach the handler for running the prediction - create a new function each time so the proper index to be passed
				var run = row.querySelector('.run');
				if (run){
					run.onclick = (function(algoIdx, row){
						return function(e){
							ToxMan.runPrediction(algoIdx);
							showhideInfo(row);
							e.stopPropagation();
						}
					})(i, row);
				}
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
		var results = document.getElementById(ToxMan.prefix + '-algo-' + algo.id).getElementsByClassName('results')[0];
		results.classList.add('invisible');
		results.innerHTML = '';		
		
		// the function that actually parses the results of predictions and fills up the UI
		var predictParser = function(prediction){
			var features = ToxMan.buildFeatures(prediction, 0);
			ToxMan.addFeatures(features, algo.name, algo.id, function(feature){
				return feature.name.indexOf('#explanation') == -1;
			});
			
			results.classList.remove('invisible');
			results.innerHTML = features[1].value;
		};
		
		// the prediction invoke trickery...
		var q = formatString(this.queries.getModel, encodeURIComponent(algo.uri));
		ConnMan.call(q, function(model){
			if (!model || model.model.length < 1){
				// TODO: we need to make a POST call to create a model first.
				
			}
			else { // OK, we have the model - attempt to get a prediction for our compound...
				var q = formatString(ToxMan.queries.getPrediction, encodeURIComponent(ToxMan.currentDataset.dataEntry[0].compound.id), encodeURIComponent(model.model[0].predicted));
				ConnMan.call(q, predictParser);	
			}
		});
	},
	
	/* Run predictions that are marked as 'auto'. Rely on the properly set id of each row in the algorithms list
	*/
	runAutos: function() {
		var autos = document.querySelectorAll('.' + this.prefix + '-algorithms .auto');
		for (var i = 0;i < autos.length; ++i){
			if (autos[i].id.length > 0 && autos[i].checked){
				this.runPrediction(parseInt(autos[i].id.substr(this.prefix.length + 10)));
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
			fillTree(row, features[i], ToxMan.prefix + '-feature');
			row.classList.remove('template');
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
};
