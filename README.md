jToxKit
=======

A kit of front-ends for accessing toxicological web services, based on [AMBIT](http://ambit.sourceforge.net). It is designed to provide easy-to-integrate
approach for using any or all of available front ends in third-party web pages.
Each different front-end is referred as _kit_. Currently available are:

- `compound` - viewer for compound datasets and query results... [more](#jtoxcompound)
- `dataset` - viewer and selector of list of datasets... [more](#jtoxdataset)
- `model` - view and selector of list of available models/algorithms... [more](#jtoxmodel)
- `study` - [IUCLID5](http://iuclid.eu/) substance studies visuzalizer... [more](#jtoxstudy)
- `query` - a wrapper around other kits and widgets, making them work together... [more](#jtoxquery).
- `tree` - a Web front end to OpenTox services. Currently developed as standalone web front-end and soon-to-be integrated in the kit...[more](#jtoxtree).

The toolkit is intended to be used by non-programmers, and thus it's integration process is rather simple - referring two files and marking a placeholder in HTML of where all the structure to be inserted. However, it relies that certain external libraries like [jQuery](http://www.jquery.com) and some of [jQueryUI](http://www.jqueryui.com) widgets are already included in the page.


Integration manual
------------------
In order to use **jToxKit** in your page, you need to implement these steps:

- In the header of the page add one script reference: `<script src="jtoxkit.js"></script>`. A minified version is available too: `<script src="jtoxkit.min.js"></script>`.
- In the header of the page add one stylesheet file reference: `<link rel="stylesheet" href="jtoxkit.css"/>`.
- At the place in HTML body, where you want to have some of _jTokKit_ widgets, add one _div_ element (example:`<div class="jtox-toolkit" data-kit="study"></div>`). More explanation of `data-XXX` parameters is given below. The class `jtox-toolkit` marks the insertion point for any _jToxKit_ kit.
- Make sure third-party libs that we depend on, are included too - they can vary for different (of our) _kits_, but these are common for entire **jToxKit**:

```
  <link rel="stylesheet" href="jquery-ui.css"/>
  <script src="jquery.js"></script>
  <script src="jquery.ui.core.js"></script>
```
-  The above steps are enough to have all structures inserted and _jToxKit_ initialized. If you need to make additional query calls, or similar, you can do so at any time **after** DOM is ready. For example querying _jToxStydy_ for studies for a substance from a given URL can go like this:

```
$(document).ready(function() { 
  jToxStudy.kits()[0].querySubstance("http://apps.ideaconsult.net:8080/biodeg/substance/IUC4-efdb21bb-e79f-3286-a988-b6f6944d3734");
});
```

**jToxKit** itself provides certain _global_ routines, which can be invoked like `jToxKit.call()`, however for ease of use, there is an alias `jT` for `jToxKit`, so `jT.call()` is also a valid reference.

### Configuration parameters

Beside specifying the exact place of code insertion the `<div>` tag, referred above, is also used to setup the type and configuration of the front-end. There are three ways to pass configuration parameters to _jToxKit_:

- As **query parameters** on the page request itself. For example jToxTree query might look like: `toxtree.html?server=http://apps.ideaconsult.net:8080/ambit2&search=caffeine`, providing `server` parameter to _jToxKit_. These become the general, jToxKit's configuration parameters.
- As **data-XXX** attributes of the inserting _div_. They follow the common *data-XXX* naming convention, i.e. `pollDelay` is referred with `data-poll-delay`. When (each) kit it automatically inserted (the default behaviour), these settings are merged with jToxKit's and are passed on kit's initialization. They take precedence over jToxKit's.
- As **JS object** when calling `j<kit name>.init(root, settings)` manually. By default on page loading, *jToxKit* scans and initialized itself, also traversing each jToxKit's `<div>`s. The later can be supressed by adding `data-manual-init` attribute, set to *true* to the `<div>`. In this case *j<tox-kit>* should be manually initialized, passing any desired parameters, which (again) will be merged, taking precedence over jToxKit's.

For example, the following three have the same effect:

1. Querying like this:

```
http://apps.ideaconsult.net:8080/toxbank/substance/IUC4-d982cd73-9ee1-32af-8604-962ae6875cc7/study?tab=P-CHEN&crossDomain=true
```

2. Or, embedding a jToxKit placeholder like this:

```
	<div class="jtox-toolkit" data-kit="study" data-tab="P-CHEN" data-cross-domain="true" data-substance-uri="http://apps.ideaconsult.net:8080/biodeg/substance/IUC4-d982cd73-9ee1-32af-8604-962ae6875cc7"></div>
```

3. Or, making a manual initialization like this:

```
$(document).ready(function(){
  var st = new jToxStudy($(".jtox-toolkit")[0], { crossDomain: true, tab: 'P-CHEM' });
  st.querySubstance("http://apps.ideaconsult.net:8080/toxbank/substance/IUC4-d982cd73-9ee1-32af-8604-962ae6875cc7");
``` 

Although different kits can have different configuration parameters, these are common:

- **`kit`**  (attr. `data-kit`), _required_: specifies the exact type of front-end to be inserted. Only one type is allowed (of course!) - currently available kits are explained in the beginning.
- **`baseUrl`** (attr. `data-base-url`), _optional_: the default server to be used on AJAX requests, if the server is not specified on the call itself.
- **`crossDomain`** (attr. `data-cross-domain`), _optional_: informs jToxKit to send requests with cross-domain headers. It is fine to be _true_ even for same-server requests, except when Internet Explorer is used. That's why it defaults to *false*.
- **`jsonp`** (attr. `data-jsonp`), _optional_: whether to use _JSONP_ style queries to the server, instead of asynchronous ones. Mind that _JSONP_ setting does not influence _POST_ requests. If this one is specified `crossDomain=true` is implied. Default is *false*.
- **`plainText`** (attr. `data-plain-text`), _optional_: if you want AJAX to expect plain text, instead of JSON - set this to true. You rarely need to do so as a setting, it is more likely to need to for specific call, which can be dome via `params` parameters of `jToxKit.call()` method, which is explained later. Default is *false*.
- **`timeout`** (attr. `data-timeout`), _optional_: the timeout for AJAX requests, in milliseconds. Default is 5000.
- **`pollDelay`** (attr. `data-poll-delay`), _optional_: certain services involve creating a task on the server and waiting for it to finish - this is the time between poll request, while waiting it to finish. In milliseconds. Default is 200.
- **`onConnect`** (attr. `data-on-connect`), _optional_: a function name, or function to be called just before any AJAX call.
- **`onSuccess`** (attr. `data-on-success`), _optional_: a function name, or function to be called upon successful complete of a AJAX call.
- **`onError`** (attr. `data-on-error`), _optional_: a function name, or function to be called when there's an error on AJAX call. The passed _callback_ to `jT.call()` is still called, but with _null_ result.
- **`onLoaded`** (attr. `data-on-loaded`), _optional_: another kit-specific callback, which is called from the kit itself, when it's main querying result has arrived, be it _dataset_, _model_ or whatever. The callback is called within kit's context (i.e. the kit instance is `this`) and the returned set is passed as first agrument. Default _null_.
- **`sDom`** (attr. `data-s-dom`). _optional_: a redefinition of sDom setting for dataTables instance. It does not apply for [jToxCompound](#jtoxcompound), because it uses two, synchronized tables and custom filter and pagination controls.
- **`configuration`** (attr. `data-configuration`), _optional_: a way to provide kit-specific configuration, like columns visibility and/or ordering for _study_ kit. If it is recognized as string value - a global vairbale with this name is used, otherwise - the passed object itself. No default value.
- **`configFile`** (attr. `data-config-file`) _optional_: Another way to provide configuration for a kit, but this time - providing the name/path of external JSON file, which is downloaded and used as configuration parameter. No default value.

As, can be seen, the three connection callbacks can be local for each kit, so it is possible to report connection statuses in the most appropriate for the kit's way. This is also true for Url's, which means that not all kits, needs to communicate with one and the same server.

### Common methods

There are certain methods that are common for all kits and some kit wrappers - like [jToxQuery](#jtoxquery) - rely on having them:

```
jToxKit.initKit(element)
```
The actual kit initialization procedure - it determines the kit that need to be used relying on `data-kit` option and creates a new instance, passing the `element` as kit's root.


```
jToxKit.kit(element)
```
Returns the instance of the kit that has the passed `element` as its root. When passed a _<div>_ element, marked with `jtox-toolkit` class - this method will return the instance that was created during kit's initialization, i.e. - during `initKit()` call.


```
jToxKit.parentKit(prototype, element)
```
Returns the instance of `prototype` which has its root as the closest parent of `element`. In other words - traverses up all the parents of `element` until it reaches a jToxKit's kit, which is of given `prototype`.


```
jToxKit.insertTool(name, root)
```
Inserts a third-party tool, which was added to jToxKit's production files, like _ketcher_, for example. It insertes that HTML code for the `name` tool under the passed `root`. If this tool has separate script files (and it probably does), it needs to be included separately on the page.

```
jToxKit.call(kit, service, params, callback)
```
The general function for making server calls - all other kits should use _this_ method. The passed `kit` instance's settings are used for _baseUrl_, _crossDomain_, _jsonp_ other that may be relevant. If null is passed - the default settings from _jToxKit_ itself are used. The most important parameter is `service` which determines the actual call to be made. The next parameter `params` is explained later - it can be omitted. Finally there is `callback`, which is called in both success and error. It's format is `function callback(result, jhr)`, where `result` is what came from server, or _null_ on error, and `jhr` is the actual jQuery AJAX object.
The `params` parameter (if present) can have the following properties:
- `data` - additional that need to be passed, this usually means also the method is _POST_ and it is set so, if not speicfied explicitly;
- `method` - the HTTP method to be used. The default is _GET_, but if some `data` is passed - it defaults to _POST_.
- `dataType` - if you want to change the expected server response to something different from JSON - use this one.

```
<kit class>.kits()
```
Return a list of all kit instances from this _kit class_. For example:
`jToxQuery.kits()[0]` returns the first instance of jToxQuery found on the page.

```
<kit instance>.modifyUri(uri)
```
When a certain kit is wrapped with another one, like the way `jToxQuery` wraps `jToxSearch` - this is the mechanism which allows `jToxQuery` to collect "preferences" of all sub-widgets, before passing the so-constructed `uri` to the main kit. Refer [jToxQuery](#jtoxquery)'s documentation for more information.

```
<kit instance>.query(uri)
```
A shorthand, general method, that _jToxQuery_ can call on any (main) kit, to perform it's prederred query method. For example for [jToxCompound](#jtoxcompound) this method is another way to call `<jToxCompound>.queryDataset(datasetUri)`.


<a name="jtoxcompound"></a> jToxCompound kit
--------------------------------------------

An OpenTox compound dataset management and visualization tool. Since _compound_ is very basic term in OpenTox hierarchy it is used in other places like [jToxQuery](#jtoxquery) and [jToxTree kit](#jtoxtree). It is vital to undestand that the scope of this kit it _not_ to provide complete, versatile interface for making queries, linking between them, etc. - it aims at visualizing and providing basic navigation within _one_ particular query. It is designed to be easily configurable - up to the point of being only one table, and easily driven with API calls, which are explained below.

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

- **`datasetUri`** (attr. `data-dataset-uri`), _optional_: This is the main URL of the dataset, that later is used for feautres query, pagination, etc. If not passed initially, a later call to `queryDataset(datasetUri)` has the same effect. 
- **`showTabs`** (attr. `data-show-tabs`), _optional_: Determines if the feature enabling / disabling tabs should be visible, or not. Default: *true*.
- **`showExport`** (attr. `data-show-export`), _optional_: Determines if the **Export** tab should be added to the right of feature-tabs, filled with possible export parameters. If `showTabs` is false, this has not effect, of course. Default: *true*.
- **`showControls`** (attr. `data-show-controls`), _optional_: Determines whether to show the block with filter and pagination controls, which include: information for current view items, dropdown menu for choosing the page size, next and previous page and filtering box. Default: *true*.
- **`hideEmpty`** (attr. `data-hide-empty`), _optional_: Determines whether to hide empty group tabs instead of make them inactive. Default: _false_.
- **`hasDetails`** (attr. `data-has-details`), _optional_: Determines whether a details openning icon and all corresponding functionality, should be shown on each row. Default: _true_.
- **`rememberChecks`** (attr. `data-remember-checks`), _optional_: Whether to remember feature check states, between different _queryDataset()_ calls. Default: _false_.
- **`metricFeature`** (attr. `data-metric-feature`), _optional_: The ID of the feature that should be used, when 'metric' field is present in the dataset. Default: *http://www.opentox.org/api/1.1#Similarity*.
- **`fnAccumulate`** (attr. `data-fn-accumulate`), _optional_: The function that should be called during dataset entries' processing, when several values need to be accumulated in the same place. The format of the function is `function fnlocation(featureId, oldValue, newValue, features)`. The default one is concatenating the passed values as comma-separated string.
- **`pageStart`** (attr. `data-page-start`), _optional_: From which item the referenced dataset should be visualized. Counted from 0. Default: *0*.
- **`pageSize`** (attr. `data-page-size`), _optional_: initial page size for queries - can later be changed either with `queryEntries()` call, or with dropdown menu, if visible. Default: *20*.
- **`onPrepared`** (attr. `data-on-prepared`), _optional_: A callback which is called when the initial call for determining the columns, tabs etc. has completed. The one-entry dataset is passed as a parameter, the context (i.e. _this_) is the kit itself. Default: _null_.


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

The only properties that need more explanation are _location_, _accumulate_, _process_, _visibility_ and _render_. The first one is used to determine where in the data entry the value for this feature is stored and/or should be written. For example in those two:

```
"http://www.opentox.org/api/1.1#CASRN" : { title: "CAS", location: "compound.cas"},
"http://www.opentox.org/api/1.1#TradeName" : {title: "Trade Name", location: "compound.tradename"}
```

this property shows that all features that are _sameAs_ **CASRN** (or **TradeName**) should location their values in `compound.cas`. This is the place that later the values will be searched too. The second property - `accumulate` determines whether such accumulation (via `fnAccumulate` function) should happen at all, or just the rendering engine will search for the value in the specified location.

The third property - `process` is used during dataset pre-processing and is of form `function process(entry, featureId, features)` and is called for each feature in the set.

The fourth one - `visibility` determines where this feature should be shown out: either on general tabs only (value of `main`); or only in detailed info tabs (value of `details`) or in both - value of `all` or missing.

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
          },
          visibility: "main"
      	},
      }
    }
```


##### Methods

_jToxCompound_ has several methods to drive visuzalization, as well as several "static" ones, which makes it possible for other kits to use its functionality. Let's start whith these:


```
jToxCompound.processDataset(dataset, features, fnValue, startIdx)
```
Only the first parameter `dataset` is required and it is the downloaded dataset, as is from the OpenTox server. If features are already preprocessed (see below) they can be passed here as second parameter - `features`. The third - `fnValue` is a user-provided function that takes part during each entry's preprocessing, it is explained in details in a second. The last parameter `startIdx` is the starting index within the dataset, if a call is made for some other part of the dataset. Remember - this is a static call and it does _not_ preserve context information like page size, index, etc.


```
jToxCompound.processFeatures(features)
```
Very important function in unified feature processing. It traverses all reported features, merging those that mean one and the same thing, as reported by their `sameAs` parameter, also takes care of predefined features that can instruct it to "location" certain feature value inside the dataset entry, itself. This is called internally by `processDataset()` or should be called if `features` parameter is passed to the later.


```
jToxCompound.processEntry(entry, features, fnValue)
```
Used extensively during dataset preprocessing. When traversing the dataset, each `entry` is passed with already preprocessed `features` so that features that need to have their values extracted and set separately _are_ processed here. Also, if several features are setup to location their values in same entry's property - it is also done here. `fnValue` function (the same passed to `processDataset()`) can participate in the process, it has the following definition: `fnValue(oldValue, newValue)`.


```
<jToxCompound>.queryDataset(datasetUri)
```
The starting point of dataset visualization. This function makes a separate call for feature-retrieving, preprocesses them (as described above), prepares the visuzalization table, showing or hiding, whatever is needed and calls `processEntries` for actual dataset entries' retrieval. Cannot be called several times within same instance.

```
<jToxCompound>.queryEntries(start, size, fnComplete)
```
The actual dataset entries retrieving function. It makes call to get entries from the already set up dataset, starting from `start`-th one and asking for `size` of them. `fnComplete` is called after all information is processed and the visuzalzation table is feeded. All pagination UI elements are updated, if not hidden.

```
<jToxCompound>.nextPage()
<jToxCompound>.prevPage()
```
These two are shortcuts for the previous function, taking into account the current page size and also taking care not to query for something outside of the known limits of the dataset.

```
<jToxCompound>.filterEntries(needle)
```
Filter the presented entries with the given needle, finding substring match on each features, not marked with `search: false` in their definition.


<a name="jtoxstudy"></a> jToxStudy kit
--------------------------------------

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

Not quite a lot yet, mainly event handlers:

- **`substanceUri`** (attr. `data-substance-uri`), _optional_: This is the URL of the substance in question. If it is passed during _jToxStudy_ initialization a call to `jToxStudy.querySubstance(uri)` is made. In either case upon successful substance info retrieval automatic calls to `jToxStudy.querySummary(uri)` and `jToxStudy.queryComposition(uri)` are made.
- **`tab`** (attr. `data-tab`), _optional_: Specifying which study top-category should be preloaded upon page loading. It can be either _encodeURIComponent()_ encoded, or spaces replaced with underscore.
- **`onLoaded`** (attr. `data-on-loaded`), _optional_: This one is invoked when the general information for the substance is loaded - before all supplmentary info is even queries (like composition, studies, etc.). As usual the context (i.e. _this_) is the kit itself, and the passed parameter is the substance data retrieved from the server. Default: _null_.
- **`onSummary`** (attr. `data-on-summary`), _optional_: Inkoved when study summary information arrives from the server. Passed as parameter, within kit's context (i.e. _this_). Default: _null_.
- **`onComposition`** (attr. `data-on-composition`), _optional_: Invoked when the composition info for that substance arrives from the server. It is passed as a parameter within kit's context (i.e. _this_). Default: _null_.
- **`onStudy`** (attr. `data-on-study`), _optional_: This one is invoked when a set of studies for certain category arrives from the server. The array of studies is passed as a parameter, again within kit's context (i.e. _this_). Default: _null_.

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


<a name="jtoxdataset"></a> jToxDataset kit
------------------------------------------

The dataset(s) browsing kit - if [jToxCompound](#jtoxcompound) is browsing entries within a data, this kit is browsing datasets on a server. It is rather simple and is mainly used as a widget within [jToxQuery](#jtoxquery) kit.

##### Parameters

There are few things that can be setup from outside:

- **`selectable`** (attr. `data-selectable`), _optional_: Determines whether the widget should show selection box in the first column. The `input` box added has the dataset _URI_ as it's value. Default: _false_.
- **`selectionHandler`** (attr. `data-selection-handler`), _optional_: Used with combination of previous parameter (_selectable_). If this one is provided it is added as `data-handler`, i.e. - it gives the name of the handler to be invokes by _jToxQuery_ when the selection box has changed it's value. Default: _null_.
- **`maxStars`** (attr. `data-max-stars`), _optional_: How many stars are considered maximum, when building the long version of ratings. Default: _10_.
- **`shortStars`** (attr. `data-short-stars`), _optional_: Whether to show show star rating notation, i.e. - one star and the number of stars next to it, opposed to the long (default) version - always showing the maximum number of stars, with given number of them - highlighted. Default is _false_.
- **`loadOnInit`** (attr. `data-load-on-init`), _optional_: Whether to make an initial query even when _datasetUri_ is not specified. Default is _false_.
- **`sDom`** (attr. `data-s-dom`), _optional_: The redefinition of _sDom_ attribute for the table. Default _"\<Fif\>rt"_.
- **`datasetUri`** (attr. `data-dataset-uri`), _optional_: The address to query for list of datasets. If none is bassed the standard `<baseURL>/dataset` is used.


##### Methods

They are not plenty - just a few:

```
<jToxDataset>.listDatasets(uri)
<jToxDataset>.query(uri)
```
Makes a query for retrieving the list of datasets from the server. If `uri` passed is null - the default form: `<baseURL>/dataset` is used.

```
<jToxDataset>.modifyUri(uri)
```
The required method for this kit to be part of [jToxQuery](#jtoxquery) kit. What it does is to scan all input boxes, which means `selectable` should be set to _true_, and add `dataset_uris[]=<selected uri>` parameter to the given `uri` for each of selected datasets.

There are several public static methods, that can be used from elsewhere:

```
jToxDataset.putStars(kit, stars, title)
```
Returns an _html_ text with given amount of `stars` put, taking into account the kit's settings for _maxStars_ and _shortStars_. The _title_ is the tooltip that is set for the block.

```
jToxDataset.addSelection(kit, oldFn)
```
Returns a _dataTables_ rendering function (i.e. `function (data, type, full)`), using the provided old one - `oldFn`, and adding a selection box, with proper handling before it.

##### Configuration

All the columns of the table can be configured, the same way [jToxStudy](#jtoxstudy) does. All column definitions are found under `dataset` property. The default set looks like this:

```
configuration: { 
  columns : {
    dataset: {
      'Id': { iOrder: 0, sTitle: "Id", mData: "URI", sWidth: "50px", mRender: function ... },
      'Title': { iOrder: 1, sTitle: "Title", mData: "title", sDefaultContent: "-" },
      'Stars': { iOrder: 2, sTitle: "Stars", mData: "stars", sWidth: "160px" },
      'Info': { iOrder: 3, sTitle: "Info", mData: "rights", mRender: function ... }
    }
  }
}

```

More columns can be added, or these can be turned off just by adding `bVisible: false` to the certain definition.

<a name="jtoxmodel"></a> jToxModel kit
------------------------------------------

The model(s) and algorithm(s) browsing kit - pretty similar to [jToxDataet](#jtoxdataset) as functionality and configuration. However, it has two modes of running - algorithm listing or model listing, and it is upon initialization. This kit is mainly used as a widget within [jToxQuery](#jtoxquery) kit.

##### Parameters

There are few things that can be setup from outside:

- **`selectable`** (attr. `data-selectable`), _optional_: Determines whether the widget should show selection box in the first column. The `input` box added has the model _URI_ as it's value. Default: _false_.
- **`selectionHandler`** (attr. `data-selection-handler`), _optional_: Used with combination of previous parameter (_selectable_). If this one is provided it is added as `data-handler`, i.e. - it gives the name of the handler to be invokes by _jToxQuery_ when the selection box has changed it's value. Default: _null_.
- **`algorithmLink`** (attr. `data-algorithm-link`), _optional_: Determines whether to add a link for viewing models filtered on specific algorithm. It'll put a link on each row and make a new request for the whole page. Other way of filtering will be to use the _dataTable_'s filter box, which won't navigate to a different page. Default: _false_.
- **`algorithms`** (attr. `data-algorithms`), _optional_: Whether to list available algorithms, rather than available models. Default: _false_.
- **`maxStars`** (attr. `data-max-stars`), _optional_: How many stars are considered maximum, when building the long version of ratings. Default: _10_.
- **`shortStars`** (attr. `data-short-stars`), _optional_: Whether to show show star rating notation, i.e. - one star and the number of stars next to it, opposed to the long (default) version - always showing the maximum number of stars, with given number of them - highlighted. Default is _false_.
- **`loadOnInit`** (attr. `data-load-on-init`), _optional_: Whether to make an initial query even when _modelUri_ or _algorithmNeedle_ are not specified. Default is _false_.
- **`sDom`** (attr. `data-s-dom`), _optional_: The redefinition of _sDom_ attribute for the table. Default _"\<Fif\>rt"_.
- **`modelUri`** (attr. `data-model-uri`), _optional_: The address to query for list of models. If none is bassed the standard `<baseURL>/model` is used.
- **`algorithmNeedle`** (attr. `data-algorithms-needle`), _optional_: If algorithms listing mode is selected (`algorithms` = _true_) - this is the needle to be used when listing them. Default: _null_.


##### Methods

They are not plenty - just a few:

```
<jToxModel>.listModels(uri)
```
Makes a query for retrieving the list of models from the server. If `uri` passed is null - the default form: `<baseURL>/model` is used.


```
<jToxModel>.listAlgorithms(needle)
```
Makes a query for retrieving all available algorithms from the server. If `needle` is passed it is used in the search of the form: `<baseURL>/algorithms?search=<needle>`.

```
<jToxModel>.query(uri)
```
This is a shortcut to either _listModels()_ or _listAlgorithms()_ method, depending on `settings.algorithms` parameter.


```
<jToxModel>.modifyUri(uri)
```
The required method for this kit to be part of [jToxQuery](#jtoxquery) kit. What it does is to scan all input boxes, which means `selectable` should be set to _true_, and add `feature_uris[]=<selected uri>` parameter to the given `uri` for each of selected models.

##### Configuration

All the columns of the table can be configured, the same way [jToxStudy](#jtoxstudy) does. All column definitions are found under `model` or `algorithm` roperties, depending on the mode the kit is running. The default set looks like this:

```
configuration: { 
  columns : {
    model: {
     'Id': { iOrder: 0, sTitle: "Id", mData: "id", sWidth: "50px", mRender: function ... },
     'Title': { iOrder: 1, sTitle: "Title", mData: "title", sDefaultContent: "-" },
     'Stars': { iOrder: 2, sTitle: "Stars", mData: "stars", sWidth: "160px" },
     'Algorithm': {iOrder: 3, sTitle: "Algorithm", mData: "algorithm" },
     'Info': { iOrder: 4, sTitle: "Info", mData: "trainingDataset", mRender: function ... }
    },
    algorithm: {
     'Id': { iOrder: 0, sTitle: "Id", mData: "id", sWidth: "150px", mRender: function ... },
     'Title': { iOrder: 1, sTitle: "Title", mData: "name", sDefaultContent: "-" },
     'Description': {iOrder: 2, sTitle: "Description", sClass: "shortened", mData: "description", sDefaultContent: '-' },
     'Info': { iOrder: 3, sTitle: "Info", mData: "format", mRender: function ... }
    }
  }
}

```

More columns can be added, or these can be turned off just by adding `bVisible: false` to the certain definition.


<a name="jtoxquery"></a> jToxQuery kit
--------------------------------------

A general purpose kit, that wraps several others to make them work together. For example - in the normal query & browse user experience, when you need to define certain criteria for your search and have a browser intepret them - you actually have one _browser_ component and one or more other, that alter the actual data to be browsed, i.e. - they alter the server queries that are made to obtain the data to be browsed. The key aspect of _jToxQuery_ is that it is independent of underlying components (kits). Of course, it relying on certain structure and behavior.

There are two type of sub-kits: _main kit_ (only one) and _widgets_ (zero or more). There is one way to determine which is which - widgets have `jtox-widget` class added to their root element. All such are enumerated and treated a bit different.

There is another important term here: _handler_, these are DOM elements that should initiate some kind of action via _jToxQuery_. These can be _input_ elements, _select_, _button_, etc. - anything that reacts on _change_ or _click_ events. They to mark an element as handler-active is to add `jtox-handler` to it's classes and then specify the name of the handler to be called, via `data-handler` attribtue. Doing so, _jToxQuery_ will take care to invoke this handler, when a change/click happens on this element.

How are handlers specified? Using the stadard _configuration_ mechanism - there is a `handler` object under `confifuration` key, which is in _jToxQuery_'s settings. This is how the default settings for _jToxQuery_ look like:

```
{ 
  configuration: {
    // this is the main thing to be configured
    handlers: { 
      query: function (el, query) { query.query(); },
    }
  }
};
```

As can be seen, each handler function is passed two arguments: `el` - the element which provoked this handler, to be called, and `query` - the instance of jToxQuery which is mitigating the call. Having that, if you define button in your HTML:

```
<button name="searchbutton" class="jtox-handler" title="Search" data-handler="query"><span class="ui-icon ui-icon-search"/></button>
```
You'll have _jToxQuery_ call the `query()` method of the _main kit_ each time the user presses this button.

There are two ways to enrich this list of handlers - pass proper _configuration_ to the _jToxQuery_ kit itself, or call `<jToxQuery>.addHandlers(handlers)` passing an object with additional handlers that you intend to use. They way to find kit's parent _jToxQuery_ instance is using `jToxKit.parentKit(jToxQuery, <kit's root element>)` method, described above.

##### Parameters

There are few things that can be setup from outside:

- **`scanDom`** (attr. `data-scan-dom`), _optional_: It can be used to stop _jToxQuery_ from scanning it's sub-elements to discover and built the _widgets_ list. Default: _true_.

- **`dom`**, _optional_: It can't be passed with data attribute, because it is an objet with two properties: `widgets` and `kit`, which can contain the DOM elements, which are roots of _widgets_ and the _main kit_ of jToxQuery. This can be used, when you want to specify them yourself, like the case when they are not _under_ the jToxQuery's root. Default _null_.
- **`initialQuery`** (atrt. `data-initial-query`), _optional_: Whether to make a initiate a query immediately after all (sub)kits are initialized. Default is _false_.
- **`service`** (attr. `data-service`), _optional: The initial serivce/uri string to be used, when building the final URI for calling. See `query()` method for more information.


##### Methods

There are just a few method of these kit:

```
jToxQuery.queryKit(element)
```

Returns the instance of `jToxQuery` kit, which is rooted in the closest parent of passed `element`. This is the way a widget, or main kit to find which jToxQuery it belongs to - passing it's `rootElement`, for example.

```
<jToxQuery>.widget(name)
```
Returns an instance of a widget, with given `name`

```
<jToxQuery>.addHandlers(handlers)
```
Adds the supplied set of `handlers` to the handler list recnognized and used by _jToxQuery_. Without doing this refering them at certain DOM elements won't have any effect.

```
<jToxQuery>.kit()
```
Returns the main kit, that is managed by this _jToxQuery_ instance.

```
<jToxQuery>.query()
```
The most important function of the kit - the one that actually incorporates all widgets and the main kit to provide the final functionality. What it does, is to walk on all widgets and ask them to alter one and the same URI, using their `modifyUri()` method. The loop looks like this:

```
uri = widget.modifyUri(uri);
```

The initial value of `uri` is the passed `service` or empty one. After the uri is build this way, a call to main kit's `query()` is made and voilah!


<a name="jtoxtree"></a> jToxTree kit
------------------------------------

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

There is also one, general set - fot the jToxKit as a whole. It has slightly different convention: `jT.<extension>`. The key moment here is that `toxstudy.html` for example, is used during the development of jToxStudy, referring jQuery, jQueryUI, jtoxkit.js, etc. files. In the same time - it **_is_** the source for final, production `jtoxkit.js` file.

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
- [htmlextract.pl](bin/htmlextract.pl) - a Perl script which extracts referred JS or CSS files from within the input and merges them altogether in the output.


### Building procedure

It is as simple as running the `build.sh` script! It can, even be run without parameters which will result in building all kits, not minifying them:

```
$ ./build.sh 
Clearing old files...
Backing tool [ketcher]...
Processing targets [common toxcompound toxstudy jtoxkit]...
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
    [--target <kit list>]  : list of kits to be included. Omit jtoxkit. Default [toxstudy].
    [--lib | -l <filename>]: html file name, referring to some external library (tool).
    [--help | -h]          : this help.

Default is like: build.sh --html .. --out ../www --css ../styles --js ../script --target toxstudy
```

The result of this script can be directly used. There is a test page for proper result, which should not produce errors when opened in the browser [test.html](www/test.html).

##### A word on external tools / libraries

You can include certain libraries to be packe during building process. Like it is done with [ketcher](http://scitouch.net/opensource/ketcher). The way it is desgined to happen is:

- Download all tool's files, most probably having one _html_ file including all necessary scripts and stylesheets.
- Refer this _html_ file in _build.sh_ call, like this: `build.sh ... -lib ../../ketcher/ketcher.html`.
- What will happen will be that JavaScripts referred in the html will be merged together in a single JavaScript file, named after _html_ file referred. (e.g. `ketcher.js`).
- The content of the _html_ file itself will be transformed into JS string (using `html2js.pl` tool) and added to the same JavaScript file.
- Also all stylesheed files will be merged together in a single .css file named after the referred _html_ file (e.g. `ketcher.css`). Both will be placed in the given output directory.
- The js-transformed html content will be added as `jToxKit.tool[]`, which means it can be inserted later into the page using this global method: `jT.insertTool(name, root)`

With the given example the call is:

```
jT.insertTool('ketcher', jT.$('#ketcher-test')[0]);
```

Any additional initialization that the particular tool needs, has to be called separately.



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


