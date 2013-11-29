jToxKit
=======

A kit of front-ends for accessing toxicological web services, based on [AMBIT](http://ambit.sourceforge.net). It is designed to provide easy-to-integrate
approach for using any or all of available front ends in third-party web pages.
Each different front-end is referred as _kit_. Currently available are:

- `study` - IUCTL
- `tree` - a Web front end to OpenTox services. Currently developed as standalone web front-end and soon-to-be integrated in the kit. Described [below](#Toxtree.js).

The toolkit is intended to be used by non-programmers, and thus it's integration process is rather simple - referring two files and marking a placeholder in HTML of where all the structure to be inserted. However, it relies that certain external libraries like [jQuery](http://www.jquery.com) and some of [jQueryUI](http://www.jqueryui.com) widgets are already included in the page.


Integration manual
------------------
In order to use **jToxKit** in your page, you need to implement these steps:

- In the header of the page add one script reference: `<script src="jtoxkit.js"></script>`. A minified version is available too: `<script src="jtoxkit.min.js"></script>`.
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
- `jsonp` (attr. `data-jsonp`), _optional_: whether to use _JSONP_ style queries to the server, instead of asynchronous ones. Mind that _JSONP_ setting does not influence _POST_ requests. Default is *false*.
- `timeout` (attr. `data-timeout`), _optional_: the timeout for AJAX requests, in milliseconds. Default is 5000.
- `pollDelay` (attr. `data-poll-delay`), _optional_: certain services involve creating a task on the server and waiting for it to finish - this is the time between poll request, while waiting it to finish. In milliseconds. Default is 200.
- `onConnect` (attr. `data-on-connect`), _optional_: a function name, or function to be called just before any AJAX call.
- `onSuccess` (attr. `data-on-success`), _optional_: a function name, or function to be called upon successful complete of a AJAX call.
- `onError` (attr. `data-on-error`), _optional_: a function name, or function to be called when there's an error on AJAX call. The passed _callback_ to `jToxKit.call()` is still called, but with _null_ result.

As, can be seen, the later three callbacks can be local for each kit, so it is possible to report connection statuses in the most appropriate for the kit's way. This is also true for Url's, which means that not all kits, needs to communicate with one and the same server.

**IMPORTANT!:** Currently only one instance of _kit_ of type per page is allowed.

### jToxStudy kit

This kit gives front-end to AMBIT services, which provide import of IUCTL generated and maintained data for toxicological studies (experiments). The kit name is `study` (for use in `data-kit` initialization attribute). First, there are several additional

##### Dependencies

From [jQueryUI](http://www.jqueryui.com) Version 1.8+, based library *jQueryUI tabs* and jQuery based [DataTables](http:/www.datatables.net) Version 1.9+:

```
	<link rel="stylesheet" href="jquery.ui.tabs.css"/>
	<link rel="stylesheet" href="jquery.dataTables.css"/>
	<script src="jquery.ui.widget.js"></script>
	<script src="jquery.ui.tabs.js"></script>
	<script src="jquery.dataTables.js"></script>
```

These are needed in the same page in order for _jToxStudy_ to work. It has some additional

##### Parameters

Not quite a lot yet, though:

- `substanceUri` (attr. `data-substance-uri`), _optional_: This is the URL of the substance in question. If it is passed during _jToxStudy_ initialization a call to `jToxStudy.querySubstance(uri)` is made. In either case upon successful substance info retrieval automatic calls to `jToxStudy.querySummary(uri)` and `jToxStudy.queryComposition(uri)` are made.


##### Methods

_jToxStudy_ methods that can be invoked from outside are quite few, actually:

`jToxStudy.init(root, settings)`

It is called either internally from _jToxKit_ upon initialization, or later from the user. The first parameter is an _HTMLElement_ which will be used for base for populating necessary DOM tree.


`jToxKit.querySubstance(substanceUri)`

If `substanceUri` parameter is not provided during initialization, this is the way to ask for studies for particular substance. Fill's up the fist tab and queries for _composition_ and _studies summary_.

`jToxKit.queryComposition(substanceUri)`

The `substanceUri` is the same as in previous function, but this one takes care only for _Composition_ tab. Usually called automatically from previous function, when it successfully retrieved substance information.

`jToxKit.querySummary(substanceUri)`

The `substanceUri` is the same as in previous function. This one queries for a summary of all studies available for the given substance. It fills up the numbers in the studies' tabs and prepares the tables for particular queries later on, which are executes upon each tab's activation.


### jToxTree kit

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

There is also one, general set - fot the jToxKit as a whole. It has slightly different convention: `jtoxkit.<extension>`. The key moment here is that `toxstudy.html` for example, is used during the development of jToxStudy, referring jQuery, jQeuryUI, jtoxkit.js, etc. files. In the same time - it **_is_** the source for final, production `jtoxkit.js` file.

##### Script and styling files merging

During [Building  procedure](#Building procedure) all script and styling files are merged together to result in **one** javascript and **one** cascading stylesheets file. It is (optionally) minified after that.

The order of merging is not specified, except the fact that jtoxkit.js (.css) is put last.

##### HTML files processing

Here comes the most interesting part - how to have development-ready HTML file and source provider for the final, production, js files in the same time? It is achieved by adding _special_ tags:

```
	<!--[[ jToxKit.templates['mytempname'] -->
	<div>…</div>
	<!-- ]]-->
```

Being an actual HTML comment it is well ignored during development. The special format of the comment, however, enables a script to convert this to following JavaScript code:

```
	jToxKit.templates['mytempname'] =
	"<div>…</div>" +
	"";
```
Of course, it may have more than one lines, and also it is not _necessary_ to be jToxKit.template[] entry. However, `jToxKit.template` entries are automatically processed during `jToxKit.init()`, and everything in there becomes the (HTML) content of specially added `<div class="jtox-template"></div>` element in the end of body of the target, user's page.

They also enable nesting, i.e.:

```
	<!--[[ jToxKit.templates['outerTemp'] -->
	<div>Some initial lines here
	<!--[[ jToxKit.templates['innerTemp'] -->
	<div>More sub-template lines</div>
	<!-- // end of inner ]]-->
	</div>
	<!-- // end of outer ]]-->
```

will result in the following JavaScript code:

```
	jToxKit.templates['outerTemp'] =
	"<div>Some initial lines here";
	
	jToxKit.templates['innerTemp'] =
	"<div>More sub-template lines</div>" +
	""; // end of inner
	
	jToxKit.templates['outerTemp'] +=
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
    [--target <kit list>]  : list of kits to be included. Omit jtoxkit. Default [toxstudy].
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


