/* 
	ToxMan.js - ToxMan JavaScript query helper

*/

window.ToxMan = {
	currentQuery: null,
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
		getPrediction: "/compound/DATASET_URI?feature_uris[]=<1>",
		postPrediction: ""
	},
	
	/* Some elements from the DOM which we use - remember them here upon init
	*/
	elements: {
		featureList: null, 		// the whole container (table) for feature list
		featureRow: null,			// a single, template, row for filling the above
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
		var q = formatString(this.queries.query, encodeURIComponent(needle)); // TODO: encode it?
		ConnMan.call(q, function(dataset){
			// start with some clearing
			ToxMan.clearResults();
			if (dataset.dataEntry.length < 1){
				ConnMan.setResult('notfound', localMessage.nothingFound);
				return false;
			}

			var root = ToxMan.elements.featureList;
			var tempRow = ToxMan.elements.featureRow;

			// ok - we have something to proceed on.
			var features = ToxMan.buildFeatures(dataset, 0);
			
			var list = document.createDocumentFragment();
			for (var i = 0;i < features.length; ++i) {
				var row = tempRow.cloneNode(true);
				fillTree(row, features[i], ToxMan.prefix + '-feature');
				row.classList.remove('template');
				list.appendChild(row);
			}
			root.appendChild(list);
			
			// now setup the diagram image
			var image = ToxMan.elements.featureImage;
			if (image){
				image.style.visibility = 'visible';
				image.src = dataset.dataEntry[0].compound.URI + '?media=image/png';
			}
		});
	},
	
	/* Queries the server for list of all supported algorithms. The corresponding place in the UI is filled with the
	results, all necessary 'run', 'auto', etc. buttons are configured too.
	*/
	listAlgos : function() {
		ConnMan.call(this.queries.listAlgos, function(algos){
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
				row.onclick = function(e){
					var info = this.getElementsByClassName('info')[0];
					var res = this.getElementsByClassName('results')[0];
					if (this.classList.contains('visible')){
						this.classList.remove('visible');
						if (info)
							info.classList.add('invisible');
					}
					else {
						this.classList.add('visible')
						if (info)
							info.classList.remove('invisible');
					}
				}
				
				// finally - attach the handler for running the prediction
				var run = row.querySelector('.run');
				if (run){
					run.onclick = function(e){
						// TODO: runs a prediction	
					}
				}
			}
			
		});
	},
	
	/* Runs a prediction (algorithm) with givel algoId on a given compoundId. 'algoId' is used to determine
	which element in the UI should be filled, so that results can be shown later.
	*/
	runPrediction : function (compoundId, algoId) {
		
	},
	
	/* Build a new array of features from 'values' and 'feature' arrays in the dataset. 
		The resulting array has {id, name, value} properties for each feature.
	*/
	buildFeatures : function(dataset, index) {
		var features = [];
		for (var i in dataset.dataEntry[index].values){
			var name = dataset.feature[i].title;
			if (name.indexOf(this.featurePrefix) == -1) // not from the accepted feature namespace
				continue;
			
			var entry = new Object();
			entry.id = i;
			entry.value = dataset.dataEntry[index].values[i];
			entry.name = name.replace(this.featurePrefix, "");
			features.push(entry);
		}
		
		return features;
	},
	
	/* Poll a given taskId and calls the callback when a result from the server comes - 
	be it "running", "completed" or "error" - the callback is always called.
	*/
	pollTask : function(taskId, callback) {
		
	},
};
