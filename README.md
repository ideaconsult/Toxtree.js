jToxKit
=======

A kit of front-ends for accessing toxicological web services, based on [AMBIT](http://ambit.sourceforge.net). It is designed to provide easy-to-integrate
approach for using any or all of available front ends in third-party web pages.
Each different front-end is referred as _kit_. Currently available are:

- `study` - [IUCLID5](http://iuclid.eu/) studies visuzalizer.
- `dataset` - viewer for dataset query results.
- `tree` - a Web front end to OpenTox services. Currently developed as standalone web front-end and soon-to-be integrated in the kit. Described [below](#jtoxtree).

The toolkit is intended to be used by non-programmers, and thus it's integration process is rather simple - referring two files and marking a placeholder in HTML of where all the structure to be inserted. However, it relies that certain external libraries like [jQuery](http://www.jquery.com) and some of [jQueryUI](http://www.jqueryui.com) widgets are already included in the page.


Integration manual
------------------
In order to use **jToxKit** in your page, you need to implement these steps:

- In the header of the page add one script reference: `<script src="jtoxkit.js"></script>`. A minified version is available too: `<script src="jT.min.js"></script>`.
- In the header of the page add one stylesheet file reference: `<link rel="stylesheet" href="jtoxkit.css"/>`.
- At the place in HTML body, where you want to have some of _jTokKit_ front-ends, add one _div_ element: `<div class="jtox-toolkit" data-kit="study"></div>`. More explanation of `data-XXX` parameters is given below. The class `jtox-toolkit` marks the insertion point for any _jToxKit_ kit.
- Make sure third-party libs that we depend on, are included too - they can vary for different (of our) _kits_, but these are common for entire **jToxKit**:

```
  <link rel="stylesheet" href="jquery-ui.css"/>
  <script src="jquery.js"></script>
  <script src="jquery.ui.core.js"></script>
```
-  The above steps are enough to have all structure inserted and _jToxKit_ initialized. If you need to make additional query calls, or similar, you can do so at any time **after** DOM is ready. For example querying _jToxStydy_ for studies for a substance from a given URL can go like this:

```
$(document).ready(function() { 
  jToxStudy.querySubstance("http://apps.ideaconsult.net:8080/biodeg/substance/IUC4-efdb21bb-e79f-3286-a988-b6f6944d3734");
});
```


### Configuration parameters

Beside specifying the exact place of code insertion the `<div>` tag, referred above, is also used to setup the type and configuration of the front-end. There are three ways to pass configuration parameters to _jToxKit_:

- As **query parameters** on the page request itself. For example jToxTree query might look like: `toxtree.html?server=http://apps.ideaconsult.net:8080/ambit2&search=caffeine`, providing `server` parameter to _jToxKit_. These become the general, jToxKit's configuration parameters.
- As **data-XXX** attributes of the inserting _div_. They follow the common *data-XXX* naming convention, i.e. `pollDelay` is referred with `data-poll-delay`. When (each) kit it automatically inserted (the default behaviour), these settings are merged with jToxKit's and are passed on kit's initialization. They take precedence over jToxKit's.
- As **JS object** when calling `j<kit name>.init(root, settings)` manually. By default on page loading, *jToxKit* scans and initialized itself, also traversing each jToxKit's `<div>`s. The later can be supressed by adding `data-manual-init` attribute, set to *true* to the `<div>`. In this case *j<tox-kit>* should be manually initialized, passing any desired parameters, which (again) will be merged, taking precedence over jToxKit's.

Although different kits can have different configuration parameters, these are common:

- `kit`  (attr. `data-kit`), _required_: specifies the exact type of front-end to be inserted. Only one type is allowed (of course!) - currently available kits are explained in the beginning.
- `server` (attr. `data-server`), _optional_: the default server to be used on AJAX requests, if the server is not specified on the call itself.
- `crossDomain` (attr. `data-cross-domain`), _optional_: informs jToxKit to send requests with cross-domain headers. It is fine to be _true_ even for same-server requests, except when Internet Explorer is used. That's why it defaults to *false*.
- `jsonp` (attr. `data-jsonp`), _optional_: whether to use _JSONP_ style queries to the server, instead of asynchronous ones. Mind that _JSONP_ setting does not influence _POST_ requests. If this one is specified `crossDomain=true` is implied. Default is *false*.
- `timeout` (attr. `data-timeout`), _optional_: the timeout for AJAX requests, in milliseconds. Default is 5000.
- `pollDelay` (attr. `data-poll-delay`), _optional_: certain services involve creating a task on the server and waiting for it to finish - this is the time between poll request, while waiting it to finish. In milliseconds. Default is 200.
- `onConnect` (attr. `data-on-connect`), _optional_: a function name, or function to be called just before any AJAX call.
- `onSuccess` (attr. `data-on-success`), _optional_: a function name, or function to be called upon successful complete of a AJAX call.
- `onError` (attr. `data-on-error`), _optional_: a function name, or function to be called when there's an error on AJAX call. The passed _callback_ to `jT.call()` is still called, but with _null_ result.
- `configuration` (attr. `data-config-file`), _optional_: a way to provide kit-specific configuration, like coulmns visibility and/or ordering for _study_ kit. When provided as `data-config-file` parameter, the configuration file is downloaded and passed as configuration parameter to kit initialization routine.

As, can be seen, the later three callbacks can be local for each kit, so it is possible to report connection statuses in the most appropriate for the kit's way. This is also true for Url's, which means that not all kits, needs to communicate with one and the same server.

###<a name="jtoxstudy"></a> jToxStudy kit

This kit gives front-end to AMBIT services, which provide import of IUCLID5 generated and maintained data for toxicological studies (experiments). The kit name is `study` (for use in `data-kit` initialization attribute). First, there are several additional

##### Dependencies

From [jQueryUI](http://www.jqueryui.com) Version 1.8+, based library *jQueryUI tabs* and jQuery based [DataTables](http:/www.datatables.net) Version 1.9+. For column resizing we also depend on [colResizable](http://quocity.com/colresizable/), which in turn needs [jQuery migrate plugin](http://jquery.com/upgrade-guide/1.9/#jquery-migrate-plugin) for its reference of `$.explorer` - feel free not to include the latest, if you don't have such error from _colResizable_ (they might update not to use it, some day).

```
	<link rel="stylesheet" href="jquery.ui.tabs.css"/>
	<link rel="stylesheet" href="jquery.dataTables.css"/>
	<script src="jquery-migrate-1.2.1.min.js"></script>
	<script src="colResizable-1.3.min.js"></script>
	<script src="jquery.ui.widget.js"></script>
	<script src="jquery.ui.tabs.js"></script>
	<script src="jquery.dataTables.js"></script>
```

These are needed in the same page in order for _jToxStudy_ to work. It has some additional

##### Parameters

Not quite a lot yet, though:

- `substanceUri` (attr. `data-substance-uri`), _optional_: This is the URL of the substance in question. If it is passed during _jToxStudy_ initialization a call to `jToxStudy.querySubstance(uri)` is made. In either case upon successful substance info retrieval automatic calls to `jToxStudy.querySummary(uri)` and `jToxStudy.queryComposition(uri)` are made.

##### Configuration

The configuration structure as passed to the kit initialization or references with `data-config-file` is used to give column visibility and re-naming possibilities. An example of valid configuration objest / json is this:

```
{
	"columns": {
		"_": { 
			"main": { 
				"name": { "bVisible": false } 
			},
			"effects": {
				"endpoint": { "sTitle": "Type", "iOrder": -2 },
				"result": { "sTitle": "Value", "iOrder": -1 }
			}
		},
		"PC_PARTITION_SECTION": {
			"effects": {
				"endpoint": { "iOrder": 0 },
				"result": { "iOrder": 0 }
			}
		}
	}
}
```

All column redefinitions are following _dataTables_ syntax, but only parameters that need to be changed are given. Additional `iOrder` is used to make reordering of the column in the table. The rule is:

- If `iOrder` is missing in column definition it is considered **0**.
- Columns are sorted on `iOrder` attribute before being passed to _dataTable_ initialization routine.

The standard `bVisible` parameter can be present (usually only for hiding) which makes the column absent from column definitions at all.

Each column (re)definitions are grouped on several levels:

- (_low_) The semantic meaning: `parameters`, `conditions`, `effects`, `protocol`, `interpretation` and `main`.
- (_high_) Per study category definitions are possible, so different categories can have different naming, ordering and visibility. The `_` category is the default.

So the actual column re-definition goes like this:

- First, the normal definition of column is taken, either from defaults or from study parsing;
- Second, if present, the column (re)definition from default category (`_`) for this column title is merge with it, overwriting existing attributes.
- Finally, if present, the column (re)definition for category-specific section, again idetified with column title (the original one) is merge/overwrited.
- If this, final, column definition has `bVisible` to be present and false - the column is extracted from further processing and addition.

The array of so built columns is then sorted on `iOrder` and passed to _dataTables_ initialization.


##### Methods

_jToxStudy_ methods that can be invoked from outside are quite few, actually:


```
new jToxStudy(root, settings)
```
It is called either internally from _jToxKit_ upon initialization, or later from the user. The first parameter is an _HTMLElement_ which will be used for base for populating necessary DOM tree. It returns a new instance of jToxStudy, referred as `<jToxStudy>` that can later be queried with methods, described below:


```
<jToxStudy>.querySubstance(substanceUri)
```
If `substanceUri` parameter is not provided during initialization, this is the way to ask for studies for particular substance. Fill's up the fist tab and queries for _composition_ and _studies summary_.


```
<jToxStudy>.queryComposition(substanceUri)
```
The `substanceUri` is the same as in previous function, but this one takes care only for _Composition_ tab. Usually called automatically from previous function, when it successfully retrieved substance information.


```
<jToxStudy>.querySummary(substanceUri)
```
The `substanceUri` is the same as in previous function. This one queries for a summary of all studies available for the given substance. It fills up the numbers in the studies' tabs and prepares the tables for particular queries later on, which are executes upon each tab's activation.

###<a name="jtoxdataset"></a> jToxDataset kit

An OpenTox dataset management and visualization tool. Since _dataset_ is very basic term in OpenTox hierarchy it is used in other places like [jToxQuery](#jtoxquery) and [jToxTree kit](#jtoxtree). It is vital that the scope of this kit it _not_ to provide complete, versatile interface for making queries, linking between them, etc. - it aims at visualizing and providing basic navigation within _one_ particular query. It is designed to be easily configurable - up to the point of being only one table, and easily driven with API calls, which are explained below.

As a consequence of this perspective, all functionality as filtering and ordering, is applied to the currently downloaded dataset entries, i.e. - one "page" of the dataset. This is due to the fact that for many datasets it is impossible to have general procedures applied to them, thus the scope of this kit is limited to local visuzalization functions only.

##### Dependencies

It has less dependencies, compare to jToxStudy, namely they are:

```
	<link rel="stylesheet" href="jquery.ui.tabs.css"/>
	<link rel="stylesheet" href="jquery.dataTables.css"/>
	<script src="jquery.ui.widget.js"></script>
	<script src="jquery.ui.tabs.js"></script>
	<script src="jquery.dataTables.js"></script>
```

##### Parameters

Parameters that can be passed either with data-XXX attributes or when initialized manually with JavaScript are:

- `datasetUri` (attr. `data-dataset-uri`), _optional_: This is the main URL of the dataset, that later is used for feautres query, pagination, etc. If not passed initially, a later call to `queryDataset(datasetUri)` has the same effect. 
- `showTabs` (attr. `data-show-tabs`), _optional_: Determines if the feature enabling / disabling tabs should be visible, or not. Default: *true*.
- `showExport` (attr. `data-show-export`), _optional_: Determines if the **Export** tab should be added to the right of feature-tabs, filled with possible export parameters. If `showTabs` is false, this has not effect, of course. Default: *true*.
- `showControls` (attr. `data-show-controls`), _optional_: Determines whether to show the block with filter and pagination controls, which include: information for current view items, dropdown menu for choosing the page size, next and previous page and filtering box. Default: *true*.
- `metricFeature` (attr. `data-metric-feature`), _optional_: The ID of the feature that should be used, when 'metric' field is present in the dataset. Default: *http://www.opentox.org/api/1.1#Similarity*.
- `fnAccumulate` (attr. `data-fn-accumulate`), _optional_: The function that should be called during dataset entries' processing, when several values need to be accumulated in the same place. The format of the function is `function fnlocation(featureId, oldValue, newValue, features)`. The default one is concatenating the passed values as comma-separated string.
- `pageStart` (attr. `data-page-start`), _optional_: From which item the referenced dataset should be visualized. Counted from 0. Default: *0*.
- `pageSize` (attr. `data-page-size`), _optional_: initial page size for queries - can later be changed either with `queryEntries()` call, or with dropdown menu, if visible. Default: *20*.


##### Configuration

Feature enabling-disabling functions and dataset entry detailed visuzalization rely pretty much on proper grouping of the features. There is a predefined dafult grouping, but it can be changed via `configuration` parameter. It is find in `group` member of it, which has the following syntax:

```
"groups" : {
	"<group name>": <array> | <function>,
	...
}
```
The `<array>` option, means an array of feature IDs, the `<function>` option is a function with following syntax: `function (groupName, miniDataset)` which should return (again) an array of feature IDs that are part of that group. It can either be function object itself, or function-name, if configuration is passed via external _json_.
The first parameter (`groupName`) is the name of the group being filled, and the second parameter - `miniDataset` is the 1-sized dataset that _jToxStudy_ queried to obtain the available features, with `features` property pre-processed. The context in which the function is called is the _jToxKit_ instance (i.e. `this` parameter).
A special case is when one (or more) of the member of the array is (are) objects and not string. This is used when certain bunch of features need to be grouped in one checkbox. The format of the object should be:

```
{ "name": "Group name", "features": [ ... <array of features> ] };
```
This can be part of the array. For example the default _Names_ group can look like this:

```
    "Names": [
      "http://www.opentox.org/api/1.1#ChemicalName",
      "http://www.opentox.org/api/1.1#TradeName",
      "http://www.opentox.org/api/1.1#IUPACName",
      { "name": "Formulas",
        "features": [
          "http://www.opentox.org/api/1.1#SMILES",
          "http://www.opentox.org/api/1.1#InChIKey",
          "http://www.opentox.org/api/1.1#InChI",
        ]
      },
      "http://www.opentox.org/api/1.1#REACHRegistrationDate"
    ],
```
Which will result in all formula-related features to be grouped in one, named _Formulas_ and thus, turning on and off can be done from single checkbox.

Another aspect that can be configured from there is the list of possible exports, it has the following format:

```
"exports": [
	{type: "<MIME type for export>", icon: "<icon location, relative to current page>"},
	...
]
```

And, finally - another key aspect that can be reconfigured is default features definitions. Something like diagram:

```
"baseFeatures": {
	"<featureId": {
		title: "<readable title>", 
		location: "<location in data entry to store locationd values during processing>",
		accumulate: true | false, // whether value of this feature need to be accumulated
		search: true | false, // is this feature searchable
		used: true | false, // put true if you want to make sure it won't show up on Other tab
		process: "function name | definition to be called during feature preparation",
		render: "<function name | definition to be called when dataTables columns are created>",
	},
	...
}
```

The only properties that need more explanation are _location_, _accumulate_, _process_ and _render_. The first one is used to determine where in the data entry the value for this feature is stored and/or should be written. For example in those two:

```
"http://www.opentox.org/api/1.1#CASRN" : { title: "CAS", location: "compound.cas"},
"http://www.opentox.org/api/1.1#TradeName" : {title: "Trade Name", location: "compound.tradename"}
```

this property shows that all features that are _sameAs_ **CASRN** (or **TradeName**) should location their values in `compound.cas`. This is the place that later the values will be searched too. The second property - `accumulate` determines whether such accumulation (via `fnAccumulate` function) should happen at all, or just the rendering engine will search for the value in the specified location.

The third property - `process` is used during dataset pre-processing and is of form `function process(entry, featureId, features)` and is called for each feature in the set.

The last property - `render` gives wider possibilities while preparing the table - it identifies a function of the following format: `function render(column, featureId)`, where _column_ is the column definition for this feature built so far (most probably - _sTitle_ put, etc.). This is dataTable column definition, that can be altered in any desired way, includin it's _mRender_ property. 

In the full configuration, shown below example of using last two can be seen for _Diagram_ property.

```
{
      "groups": {
        "Identifiers" : [
          "http://www.opentox.org/api/1.1#Diagram", 
          "http://www.opentox.org/api/1.1#CASRN", 
          "http://www.opentox.org/api/1.1#EINECS",
          "http://www.opentox.org/api/1.1#IUCLID5_UUID"
        ],
        
        "Names": [
          "http://www.opentox.org/api/1.1#ChemicalName",
          "http://www.opentox.org/api/1.1#TradeName",
          "http://www.opentox.org/api/1.1#IUPACName",
          "http://www.opentox.org/api/1.1#SMILES",
          "http://www.opentox.org/api/1.1#InChIKey",
          "http://www.opentox.org/api/1.1#InChI",
          "http://www.opentox.org/api/1.1#REACHRegistrationDate"
        ],
        
        "Calculated": function (name, features) {
          var arr = [];
          for (var f in features) {
            if (!ccLib.isNull(features[f].source) && !ccLib.isNull(features[f].source.type) && !features[f].source.type.toLowerCase() == "algorithm")
              arr.push(f);
          }
          return arr;
        },
        
        "Other": function (name, features) {
          var arr = [];
          for (var f in features) {
            if (!features[f].used)
              arr.push(f);
          }
          return arr;
        }
      },
      "exports": [
        {type: "chemical/x-mdl-sdfile", icon: "images/sdf.jpg"},
        {type: "chemical/x-cml", icon: "images/cml.jpg"},
        {type: "chemical/x-daylight-smiles", icon: "images/smi.png"},
        {type: "chemical/x-inchi", icon: "images/inchi.png"},
        {type: "text/uri-list", icon: "images/link.png"},
        {type: "application/pdf", icon: "images/pdf.png"},
        {type: "text/csv", icon: "images/excel.png"},
        {type: "text/plain", icon: "images/excel.png"},
        {type: "text/x-arff", icon: "images/weka.png"},
        {type: "text/x-arff-3col", icon: "images/weka.png"},
        {type: "application/rdf+xml", icon: "images/rdf.gif"},
        {type: "application/json", icon: "images/json.png"}
      ]
      "exports": [
        {type: "chemical/x-mdl-sdfile", icon: "images/sdf.jpg"},
        {type: "chemical/x-cml", icon: "images/cml.jpg"},
        {type: "chemical/x-daylight-smiles", icon: "images/smi.png"},
        {type: "chemical/x-inchi", icon: "images/inchi.png"},
        {type: "text/uri-list", icon: "images/link.png"},
        {type: "application/pdf", icon: "images/pdf.png"},
        {type: "text/csv", icon: "images/excel.png"},
        {type: "text/plain", icon: "images/excel.png"},
        {type: "text/x-arff", icon: "images/weka.png"},
        {type: "text/x-arff-3col", icon: "images/weka.png"},
        {type: "application/rdf+xml", icon: "images/rdf.gif"},
        {type: "application/json", icon: "images/json.png"}
      ],

      "baseFeatures": {
      	"http://www.opentox.org/api/1.1#Similarity": {title: "Similarity", location: "compound.metric", search: true, used: true},
      	"http://www.opentox.org/api/1.1#Diagram": {title: "Diagram", search: false, used: true, 
      	  process: function(entry) {
            entry.compound.diagramUri = entry.compound.URI.replace(/(.+)(\/conformer.*)/, "$1") + "?media=image/png";
      	  },
      	  render: function(col){
      	    col["mData"] = "compound.diagramUri";
            col["mRender"] = function(data, type, full) {
              return (type != "display") ? "-" : '<img src="' + data + '" class="jtox-ds-smalldiagram jtox-details-open"/>';  
            };
            col["sClass"] = "paddingless";
            col["sWidth"] = "125px";
            return col;
        	}
      	},
      }
    }
```


##### Methods

_jToxDataset_ has several methods to drive visuzalization, as well as several "static" ones, which makes it possible for other kits to use its functionality. Let's start whith these:


```
jToxDataset.processDataset(dataset, features, fnValue, startIdx)
```
Only the first parameter `dataset` is required and it is the downloaded dataset, as is from the OpenTox server. If features are already preprocessed (see below) they can be passed here as second parameter - `features`. The third - `fnValue` is a user-provided function that takes part during each entry's preprocessing, it is explained in details in a second. The last parameter `startIdx` is the starting index within the dataset, if a call is made for some other part of the dataset. Remember - this is a static call and it does _not_ preserve context information like page size, index, etc.


```
jToxDataset.processFeatures(features)
```
Very important function in unified feature processing. It traverses all reported features, merging those that mean one and the same thing, as reported by their `sameAs` parameter, also takes care of predefined features that can instruct it to "location" certain feature value inside the dataset entry, itself. This is called internally by `processDataset()` or should be called if `features` parameter is passed to the later.


```
jToxDataset.processEntry(entry, features, fnValue)
```
Used extensively during dataset preprocessing. When traversing the dataset, each `entry` is passed with already preprocessed `features` so that features that need to have their values extracted and set separately _are_ processed here. Also, if several features are setup to location their values in same entry's property - it is also done here. `fnValue` function (the same passed to `processDataset()`) can participate in the process, it has the following definition: `fnValue(oldValue, newValue)`.

```
jToxDataset.shortFeatureId(featureId)
```
A small helper which returns the part of the feature id, which is _after_ # sign.

Now is time to review a bit more on instance methods of jToxDatset:

```
<jToxDataset>.queryDataset(datasetUri)
```
The starting point of dataset visualization. This function makes a separate call for feature-retrieving, preprocesses them (as described above), prepares the visuzalization table, showing or hiding, whatever is needed and calls `processEntries` for actual dataset entries' retrieval. Cannot be called several times within same instance.

```
<jToxDataset>.queryEntries(start, size, fnComplete)
```
The actual dataset entries retrieving function. It makes call to get entries from the already set up dataset, starting from `start`-th one and asking for `size` of them. `fnComplete` is called after all information is processed and the visuzalzation table is feeded. All pagination UI elements are updated, if not hidden.

```
<jToxDataset>.nextPage()
<jToxDataset>.prevPage()
```
These two are shortcuts for the previous function, taking into account the current page size and also taking care not to query for something outside of the known limits of the dataset.

```
<jToxDataset>.filterEntries(needle)
```
Filter the presented entries with the given needle, finding substring match on each features, not marked with `search: false` in their definition.


###<a name="jtoxquery"></a> jToxQuery kit

A kit on top of the others for cross queries, running predictions, etc.


###<a name="jtoxtree"></a> jToxTree kit

A special usage of jToxQuery for ToxTree purposes along with decision tree visualziation.
**IMPORTANT!:** Not yet implemented as part of *jToxKit*.


How is made and how to build?
-----------------------------

The following information is not intended for end users, but it gives a detailed overview of the procedure and layout of development and building of _jTokKit_.

### General concept - js, html, css files, merging, templates, etc.

As described in the beginning, the main concept is to allow easy use of the whole toolkit - even easier than _jQuery_-based widgets and libraries. This usually contradicts with ease of development. That's why we established certain structure and rules of development process, so we can keep it easy, while providing ways for automatic production of end-user files for user-page integration.

In order to archive this, these rules are followed:

- All normal HTML, JS and CSS files that are needed, have to work as-is during the development process, so that changing anything in either of them can be immediately tested in the (development) browser.
- Development files should be separate, so each kit lives in separate (script and/or styling) files. Working on thousand-lines behemoths is not an acceptable option.
- The process of preparing and packaging of the above should be automated, i.e. - no manual procedure should be involved while just-tested in development structure needs to go to production files (in our case: one JS and one CSS file).

In order to archive these there are few things that we've established


##### File naming

Each different kit, presumably needs three files: one JS, one HTML and one CSS. They all need to have same names, built like this: `tox<kit name>.<extension>`. For example for `study` kit, the three files are:`toxstudy.html`, `toxstudy.js` and `toxstudy.css`.

There is also one, general set - fot the jToxKit as a whole. It has slightly different convention: `jT.<extension>`. The key moment here is that `toxstudy.html` for example, is used during the development of jToxStudy, referring jQuery, jQeuryUI, jtoxkit.js, etc. files. In the same time - it **_is_** the source for final, production `jtoxkit.js` file.

##### Script and styling files merging

During [Building  procedure](#Building procedure) all script and styling files are merged together to result in **one** javascript and **one** cascading stylesheets file. It is (optionally) minified after that.

The order of merging is not specified, except the fact that jtoxkit.js (.css) is put last.

##### HTML files processing

Here comes the most interesting part - how to have development-ready HTML file and source provider for the final, production, js files in the same time? It is achieved by adding _special_ tags:

```
	<!--[[ jT.templates['mytempname'] -->
	<div>…</div>
	<!-- ]]-->
```

Being an actual HTML comment it is well ignored during development. The special format of the comment, however, enables a script to convert this to following JavaScript code:

```
	jT.templates['mytempname'] =
	"<div>…</div>" +
	"";
```
Of course, it may have more than one lines, and also it is not _necessary_ to be jT.template[] entry. However, `jT.template` entries are automatically processed during `jT.init()`, and everything in there becomes the (HTML) content of specially added `<div class="jtox-template"></div>` element in the end of body of the target, user's page.

They also enable nesting, i.e.:

```
	<!--[[ jT.templates['outerTemp'] -->
	<div>Some initial lines here
	<!--[[ jT.templates['innerTemp'] -->
	<div>More sub-template lines</div>
	<!-- // end of inner ]]-->
	</div>
	<!-- // end of outer ]]-->
```

will result in the following JavaScript code:

```
	jT.templates['outerTemp'] =
	"<div>Some initial lines here";
	
	jT.templates['innerTemp'] =
	"<div>More sub-template lines</div>" +
	""; // end of inner
	
	jT.templates['outerTemp'] +=
	"</div>" +
	""; // end of outer
```

##### Building scripts

There are two scripts, involved in the process:

- [html2js.pl](bin/html2js.pl) - Perl script for converting html to javascript in the specified way; 
- [jsminify.pl](bin/jsminify.pl) - a Perl script for minification (Copyright (C) 2007 by Peter Michaux);
- [build.sh](bin/build.sh) - a (bash) shell script for running the above, merging necessary files and writing the final, production ones.


### Building procedure

It is as simple as running the `build.sh` script! It can, even be run without parameters which will result in building all kits, not minifying them:

```
$ ./build.sh 
Clearing old files...
Processing targets [toxstudy jtoxkit]...
Merging JS files from [../scripts] ...
Adding html2js transformed ones from [..]...
Merging CSS files from [../styles] ...
Done.
```

However, there are few parameters that can be provided, mainly for setting new paths:

```
Usage: build.sh [options]
Options can be one or more from the following:

    [--min | -m]           : run minification of the output js, producing additional .min.js file.
    [--html <html dir>]    : the directory where html files live. Default is [..].
    [--out <output dir>]   : the directory where output files should be put. Default is [../www].
    [-css <styles dir>]    : the directory where styling files live. Default is [../styles].
    [--js <js dir>]        : the directory where script files live. Default is [../scripts].
    [--target <kit list>]  : list of kits to be included. Omit jT. Default [toxstudy].
    [--help | -h]          : this help.

Default is like: build.sh --html .. --out ../www --css ../styles --js ../script --target toxstudy
```

The result of this script can be directly used. There is a test page for proper result, which should not produce errors when opened in the browser [test.html](www/test.html).



OLD: Toxtree.js
==========

Web version of ToxTree (http://toxtree.sf.net) front-end for toxicity
predictions, using the OpenTox API (http://www.opentox.org). It is the front end
only, it relies on existing server installation of OpenTox.

It is a pure AJAX-based solution, with single HTML page as an entry point and
utilization of asynchronous HTTP requests for obtaining all information, which
is then dynamically laid out on the page.

*Toxtree.js* is relatively UI-independent framework for querying OpenTox server
for compounds information and running toxicity predictions on it, using any of
server-provided algorithms (models) for such predictions.

#### Loading

As a single page interface, it can be loaded from any place, including locally.
To make this possible the location of the server to be used should be provided
as URL parameter:

`
file:///.../toxtree.html?server=http://apps.ideaconsult.net:8080/ambit2&search=caffeine
`

As can be seen from the example - the root of OpenTox installation should be
provided in `server` parameter and it'll be prepended to all future requests.
The other thing that can be seen is the `search` parameter, which can be used to
initiate immediate query for provided compound.

The provided query string can be any compound identifier (CAS, Name, EINECS) or
SMILES or InChl - it will be handled properly.

#### Files description

Although one file is important - `toxtree.js` - several are necessary for
completing the interface:

-   [toxtman.js] (scripts/toxman.js) - implementation of ToxMan object, with
    it's functions, communication, etc. All ToxTree relatd logic lives here. -
    [toxtree.html] (toxtree.html) - the interface itself, with all necessary
    elements to be used and filled. - [toxtree.js] (scripts/toxtree.js) - a
    small script for initializing ToxMan and providing necessary bindings - like
    pressing the Query button and call of ToxMan.query(). - [common.js]
    (scripts/common.js) - some helper functions, mainly for automatic filling of
    passed json data into a DOM tree. - [toxtree.css] (styles/toxtree.css) - all
    styles for *toxtree.html*, only `template` is used in *toxtree.js* - known
    to mark template rows and providing invisiblity, and toxicity categories
    `toxic`, `nontoxic`, `inconclusive`, `unknown` and `active` to mark which is
    the predicted one. - [jquery.js] (scripts/jquery.js) - jQuery library. -
    [dataset.js] (scripts/dataset.js) - Small library to make Element.dataset
    available for nice browsers like Internet Explorer. - Skeleton stylesheets -
    [base.css] (styles/base.css), [layout.css] (styles/layout.css) and
    [skeleton.css] (styles/skeleton.css).

Actually *toxtree.html*, *toxtree.js* and *toxtree.css* can be seen as an
example of using *toxtree.js*

#### Configure UI elements

To achieve it's UI independency *Toxtree.js* relies on certain structure of the
HTML that includes it and it "navigates" in it, searching for elements with
certain classes. All elements can be manually provided to *Toxtree.js* upon
initialization, which is explained in [Initialization settings]
(#Initialization_settings). However, if not provided all elements are searched
in the DOM. All key elements can be prepended with a random `prefix` which is
passed to the initialization routine, enabling existence of several ToxTree
structures in the same DOM. All listed names are class names and all lists (like
feature list) rely on the same structure:

-   `row-blank` marks an empty row, which should be multiplied dynamically with
    reported data. It can be marked with `template` too to stay hidden when it's
    empty - it'll be removed. - `row-header` marks an empty header row, which
    occupies all columns of the list and can be filled dynamically too. Used
    only in *feature list*. - `body` marks the element which should be filled
    with cloned *row-blank*s or *row-header*s, as direct children. It is not
    necessary to be parent of *row-blank* (or *row-header*) when they stay
    empty, but it'll become their parent upon filling the data.

After we've discussed list declaration basics, we can move to main ToxTree
elements:

-   `<prefix>-features` marks the element which is the root of features list. -
    `<prefix>-diagram` marks an image element that should be used to present the
    compound diagram. - `<prefix>-models` marks the element which is the root of
    list of models. There are several sub-elements that may exist here, which
    are *not* prepended with prefix (they are searched as sub-elements of the
    root): - `auto` marks the checkbox which determines whether this model
    should be run automatically on each new query. - `run` marks the button that
    initiates the prediction, so that toxtree.js can attach on its `onclick`
    event. - `explanation` marks an element which will be filled with complete
    textual information, reported from the model on successful prediction. -
    `class-result` the root element for filling all reported classification
    classes - just like `body` class for lists. - `class-blank` a blank element
    for a classification class - to be filled up there.

These are all elements that participate in building the UI. Few of them can be
provided during initialization, which is explained in the next chapter.

#### Initialization settings

ToxTree is initialized one of its functions - `init(settings)`. We'll explain
the *settings* parameter here:

-   `server` - a link to OpenTox root. If not present the URL is parsed to
    search for *server* query parameter. It it is still not found - the calling
    *host* is considered. - `jsonp` - true / false to setup whether this method
    should be used to avoid Cross Domain security restrictions. If the server is
    not configured to provide the necessary header - this should be used,
    although some functionality will not be available - creation of new
    prediction models. - `forceCreate` - If set to *true* forces creation of a
    model and prediction on each prediction request, skipping the attempt to get
    an already existing one on the server. - `timeout` - the connection timeout,
    after which the request will be considered failed. In milliseconds. -
    `pollDelay` - how much time to wait between request while waiting a certain
    server task to be finished. In milliseconds. - `onconnect` - a handler
    `function(url)` to be invoked at the beginning of each server request. -
    `onerror` - a handler `function(code, message)` to be invoked when a request
    fails. - `onsuccess` - a handler `function(code, message)` to be invoked on
    successful server request.

These were connection-related settings. Now the UI-related ones.

-   `prefix` which is to be used when searching for certain UI elements as
    described above. - `onmodeladd` a handler `function (row, idx)` which is
    called when a new prediction model is added to the UI. `row` is the cloned
    blank row and `idx` is the model's index in *ToxMan*'s list. - `onrun` a
    handler `function(row, idx, event)` which is called when a prediction is
    run. The additional `event` parameter is from the original event that
    initiated the fun - button click, for example. - `onpredicted` a handler
    `function(row, idx)` called when the prediction is completed and the results
    are just about to be filled. - `onclear` a handler `function (row, idx)`
    called just after a row of prediction results was cleared. - `elements` an
    object containing all key UI elements to be used, as described above:
    `featureList`,`featureRow`, `featureHeader`, `diagramImage`, `modelList` and
    `modelRow`.

 Toxtree.js API
---------------

All communication with *ToxMan* is done using a short list of functions and few
member-variables:

``` ToxMan.currentDataset ```

Holds the dataset, as reported from server from the current query. Refer to
OpenTox JSON API for the dataset structure.

``` ToxMan.models ```

An array of available prediction models, as reported from server. Each element
has OpenTox's structure, with two changes - from `name` the provided prefix is
removed (most likely - *ToxTree* ) and `index` is added - it corresponds to the
index in this array. It is filled from `ToxMan.listModels()`.

``` ToxMan.queryParams ```

Paramets in the URL which loaded the page. For example `server` and `search` can
be found here.

``` ToxMan.inQuery ```

A simple flag showing whether we're in a query process now. Attempting to call
query while this is 'true' is ignored.

``` ToxMan.init(settings) ```

We've already explained the parameter of that one. This is the first function to
be called - it initializes the server string, searches and fills the elements in
the UI, etc. Nothing else will work if this is not called prior it.

``` ToxMan.listModels() ```

This is most likely the second function to be called, because it fills the UI
with all models supported from the server. Need to be called once and the list
is stored in `ToxMan.models`. The provided `onmodeladd` handler is called for
each reported model.

``` ToxMan.query(needle) ```

The starting point of each prediction - a query for certain compound. The needle
is provided as Identifier (CAS, Name, EINECS) or SMILES or InChl - it is
directly send to the server as is provided here. On success - the `featureList`
and `diagramImage` are filled.

``` ToxMan.clear() ```

Clears all result from query and predictions - bring the interface to it's
initial state. The provided `onclear` handler is called for each model row.

``` ToxMan.runPrediction(index) ```

Runs a prediction on the compound from the current query, identified by `index`
in the `ToxMan.models` list. The provided `onrun` handler function is called
immediately and `onpredicted` handler is called after the results arrived and
just before they are filled in the UI.

``` ToxMan.runAutos() ```

A convenient function which walks on each prediction model row and make a call
to `ToxMan.runPrediction()` if it's *auto* checkbox is marked.


