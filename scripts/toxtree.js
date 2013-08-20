/* 
	toxtree.js - ToxTree JavaScript query helper

*/

window.ToxMan = {
	currentQuery: null,
	prefix: 'toxtree',
	
	/* A single place to hold all necessary queries. Parameters are marked with [XX] and formatString() (common.js) is used
	to prepare the actual URLs
	*/
	queries: {
		query: "",
		listAlgo: "",
		getImage: "",
		taskPoll: "",
		getModel: "",
		postModel: "",
		getPrediction: "",
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
		this.elements.featureRow = featureList.getElementsByClassName('row')[0];
		this.elements.featureList = featureList.getElementsByClassName('body')[0];
		
		this.elements.featureImage = document.getElementsByClassName(prefix + '-diagram')[0];
		var algoList = document.getElementsByClassName(prefix + '-algorithms')[0];
		this.elements.algoRow = algoList.getElementsByClassName('row')[0];
		this.elements.algoList = algoList.getElementsByClassName('body')[0];
	},
	
	/* Makes a query for dataset based on a needle - the starting point of all actions.
	*/
	query : function(needle) {
		var q = formatString(this.queries.query, encodeURI(needle));
		ConnMan.call(q, function(dataset){
			var features = ToxTree.parseFeatures(dataset);
			var root = ToxTree.elements.featureList;
			var tempRow = ToxTree.elements.featureRow;
			
			clearChildren(root);
			var list = document.createDocumentFragment();
			for (var i = 0;i < features.length; ++i) {
				var row = tempRow.cloneNode(true);
				fillTree(row, features[i], prefix + '-feature');
				list.appendChild(row);
			}
			root.appendChild(list);
		});
	},
	
	/* Queries the server for list of all supported algorithms. The corresponding place in the UI is filled with the
	results, all necessary 'run', 'auto', etc. buttons are configured too.
	*/
	listAlgos : function() {
		ConnMan.call(q, function(algos){
			var root = ToxTree.elements.algoList;
			var tempRow = ToxTree.elements.algoRow;
			var infoRow = ToxTree.elements.algoInfo;
			
			clearChildren(root);
			var list = document.createDocumentFragment();
			for (var i = 0;i < algos.length; ++i) {
				var row = tempRow.cloneNode(true);
				fillTree(row, algos[i], prefix + '-algo');
/* 				row.getElementsByClassName('info')[0].onclick = algoInfoClicked; */
/* 				row.getElementsByClassName('run')[0].onclick = algoRunClicked; */
				list.appendChild(row);
			}
			root.appendChild(list);
		});
	},
	
	/* Runs a prediction (algorithm) with givel algoId on a given compoundId. 'algoId' is used to determine
	which element in the UI should be filled, so that results can be shown later.
	*/
	runPrediction : function (compoundId, algoId) {
		
	},
	
	/* Parse the given dataset into array of <featureID>:<featureValue> pairs
	*/
	parseFeatures : function(dataset) {
		
	},
	
	/* Poll a given taskId and calls the callback when a result from the server comes - 
	be it "running", "completed" or "error" - the callback is always called.
	*/
	pollTask : function(taskId, callback) {
		
	},
};

/* Called from the button that shows / hides detailed information for an algorithm
*/
function algoInfoClicked(e){
}

/* Called from the button that runs a prdiction with given alforithm
*/
function algoRunClicked(e){
}