
Toxtree.js
==========

Web version of ToxTree (http://toxtree.sf.net) front-end for toxicity predictions, using the OpenTox API (http://www.opentox.org). It is the front end only, it relies on existing server installation of OpenTox.

It is a pure AJAX-based solution, with single HTML page as an entry point and utilization of asynchronous HTTP requests for obtaining all information, which is then dynamically laid out on the page.

*Toxtree.js* is relatively UI-independent framework for querying OpenTox server for compounds information and running toxicity predictions on it, using any of server-provided algorithms (models) for such predictions.


#### Loading

As a single page interface, it can be loaded from any place, including locally. To make this possible the location of the server to be used should be provided as URL parameter:

```
file:///.../toxtree.html?server=http://apps.ideaconsult.net:8080/ambit2&search=caffeine
```

As can be seen from the example - the root of OpenTox installation should be provided in `server` parameter and it'll be prepended to all future requests. The other thing that can be seen is the `search` parameter, which can be used to initiate immediate query for provided compound.

The provided query string can be any compound identifier (CAS, Name, EINECS) or SMILES or InChl - it will be handled properly.

#### Files description

Although one file is important - `toxtree.js` - several are necessary for completing the interface:

- [toxtman.js] (scripts/toxman.js) - implementation of ToxMan object, with it's functions, communication, etc. All ToxTree relatd logic lives here.
- [toxtree.html] (toxtree.html) - the interface itself, with all necessary elements to be used and filled.
- [toxtree.js] (scripts/toxtree.js) - a small script for initializing ToxMan and providing necessary bindings - like pressing the Query button and call of ToxMan.query().
- [common.js] (scripts/common.js) - some helper functions, mainly for automatic filling of passed json data into a DOM tree.
- [toxtree.css] (styles/toxtree.css) - all styles for *toxtree.html*, only `template` is used in *toxtree.js* - known to mark template rows and providing invisiblity, and toxicity categories `toxic`, `nontoxic`, `inconclusive`, `unknown` and `active` to mark which is the predicted one.
- [jquery.js] (scripts/jquery.js) - jQuery library.
- [dataset.js] (scripts/dataset.js) - Small library to make Element.dataset available for nice browsers like Internet Explorer.
- Skeleton stylesheets - [base.css] (styles/base.css), [layout.css] (styles/layout.css) and [skeleton.css] (styles/skeleton.css).

Actually *toxtree.html*, *toxtree.js* and *toxtree.css* can be seen as an example of using *toxtree.js*

#### Configure UI elements

To achieve it's UI independency *Toxtree.js* relies on certain structure of the HTML that includes it and it "navigates" in it, searching for elements with certain classes. All elements can be manually provided to *Toxtree.js* upon initialization, which is explained in [Initialization settings] (#Initialization_settings). However, if not provided all elements are searched in the DOM. All key elements can be prepended with a random `prefix` which is passed to the initialization routine, enabling existence of several ToxTree structures in the same DOM. All listed names are class names and all lists (like feature list) rely on the same structure:

- `row-blank` marks an empty row, which should be multiplied dynamically with reported data. It can be marked with `template` too to stay hidden when it's empty - it'll be removed.
- `row-header` marks an empty header row, which occupies all columns of the list and can be filled dynamically too. Used only in *feature list*.
- `body` marks the element which should be filled with cloned *row-blank*s or *row-header*s, as direct children. It is not necessary to be parent of *row-blank* (or *row-header*) when they stay empty, but it'll become their parent upon filling the data.

After we've discussed list declaration basics, we can move to main ToxTree elements:

- `<prefix>-features` marks the element which is the root of features list.
- `<prefix>-diagram` marks an image element that should be used to present the compound diagram.
- `<prefix>-models` marks the element which is the root of list of models. There are several sub-elements that may exist here, which are *not* prepended with prefix (they are searched as sub-elements of the root):
- `auto` marks the checkbox which determines whether this model should be run automatically on each new query.
- `run` marks the button that initiates the prediction, so that toxtree.js can attach on its `onclick` event.
- `explanation` marks an element which will be filled with complete textual information, reported from the model on successful prediction.
- `class-result` the root element for filling all reported classification classes - just like `body` class for lists.
- `class-blank` a blank element for a classification class - to be filled up there.

These are all elements that participate in building the UI. Few of them can be provided during initialization, which is explained in the next chapter.

#### Initialization settings

ToxTree is initialized one of its functions - `init(settings)`. We'll explain the *settings* parameter here:

- `server` - a link to OpenTox root. If not present the URL is parsed to search for *server* query parameter. It it is still not found - the calling *host* is considered.
- `jsonp` - true / false to setup whether this method should be used to avoid Cross Domain security restrictions. If the server is not configured to provide the necessary header - this should be used, although some functionality will not be available - creation of new prediction models.
- `forceCreate` - If set to *true* forces creation of a model and prediction on each prediction request, skipping the attempt to get an already existing one on the server.
- `timeout` - the connection timeout, after which the request will be considered failed. In milliseconds.
- `pollDelay` - how much time to wait between request while waiting a certain server task to be finished. In milliseconds.
- `onconnect` - a handler `function(url)` to be invoked at the beginning of each server request.
- `onerror` - a handler `function(code, message)` to be invoked when a request fails.
- `onsuccess` - a handler `function(code, message)` to be invoked on successful server request.

These were connection-related settings. Now the UI-related ones.

- `prefix` which is to be used when searching for certain UI elements as described above.
- `onmodeladd` a handler `function (row, idx)` which is called when a new prediction model is added to the UI. `row` is the cloned blank row and `idx` is the model's index in *ToxMan*'s list.
- `onrun` a handler `function(row, idx, event)` which is called when a prediction is run. The additional `event` parameter is from the original event that initiated the fun - button click, for example.
- `onpredicted` a handler `function(row, idx)` called when the prediction is completed and the results are just about to be filled.
- `onclear` a handler `function (row, idx)` called just after a row of prediction results was cleared.
- `elements` an object containing all key UI elements to be used, as described above: `featureList`,`featureRow`, `featureHeader`, `diagramImage`, `modelList` and `modelRow`.


Toxtree.js API
--------------

All communication with *ToxMan* is done using a short list of functions and few member-variables:

```
ToxMan.currentDataset
```

Holds the dataset, as reported from server from the current query. Refer to OpenTox JSON API for the dataset structure.

```
ToxMan.models
```

An array of available prediction models, as reported from server. Each element has OpenTox's structure, with two changes - from `name` the provided prefix is removed (most likely - *ToxTree* ) and `index` is added - it corresponds to the index in this array.
It is filled from `ToxMan.listModels()`.

```
ToxMan.queryParams
```

Paramets in the URL which loaded the page. For example `server` and `search` can be found here.

```
ToxMan.inQuery
```

A simple flag showing whether we're in a query process now. Attempting to call query while this is 'true' is ignored.

```
ToxMan.init(settings)
```

We've already explained the parameter of that one. This is the first function to be called - it initializes the server string, searches and fills the elements in the UI, etc. Nothing else will work if this is not called prior it.

```
ToxMan.listModels()
```

This is most likely the second function to be called, because it fills the UI with all models supported from the server. Need to be called once and the list is stored in `ToxMan.models`. The provided `onmodeladd` handler is called for each reported model.

```
ToxMan.query(needle)
```

The starting point of each prediction - a query for certain compound. The needle is provided as Identifier (CAS, Name, EINECS) or SMILES or InChl - it is directly send to the server as is provided here. On success - the `featureList` and `diagramImage` are filled.

```
ToxMan.clear()
```

Clears all result from query and predictions - bring the interface to it's initial state. The provided `onclear` handler is called for each model row.

```
ToxMan.runPrediction(index)
```

Runs a prediction on the compound from the current query, identified by `index` in the `ToxMan.models` list. The provided `onrun` handler function is called immediately and `onpredicted` handler is called after the results arrived and just before they are filled in the UI.

```
ToxMan.runAutos()
```

A convenient function which walks on each prediction model row and make a call to `ToxMan.runPrediction()` if it's *auto* checkbox is marked.

