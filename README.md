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

- [toxtree.js] (scripts/toxtree.js) - implementation of ToxMan object, with it's functions, communication, etc. All ToxTree relatd logic lives here.
- [toxtree.html] (toxtree.html) - the interface itself, with all necessary elements to be used and filled.
- [common.js] (scripts/common.js) - a small script for initializing ToxMan and providing necessary bindings - like pressing the Query button and call of ToxMan.query().
- [toxtree.css] (styles/toxtree.css) - all styles for *toxtree.html*, only `template` is used in *toxtree.js* - known to mark template rows and providing invisiblity, and toxicity categories `toxic`, `nontoxic`, `inconclusive`, `unknown` and `active` to mark which is the predicted one.
- [jquery.js] (scripts/jquery.js) - jQuery library.
- [dataset.js] (scripts/dataset.js) - Small library to make Element.dataset available for nice browsers like Internet Explorer.
- Skeleton stylesheets - [base.css] (styles/base.css), [layout.css] (styles/layout.css) and [skeleton.css] (styles/skeleton.css).

Actually *toxtree.html*, *common.js* and *toxtree.css* can be seen as an example of using *toxtree.js*

#### Configure UI elements

To achieve it's UI independency *Toxtree.js* relies on certain structure of the HTML that includes it and it "navigates" in it, searching for elements with certain classes. All elements can be manually provided to *Toxtree.js* upon initialization, which is explained in [Initialization settings] (#Initialization_settings). However, if not provided all elements are searched in the DOM. All key elements can be prepended with a random `prefix` which is passed to the initialization routine, enabling existence of several ToxTree structures in the same DOM. All listed names are class names and all lists (like feature list) rely on the same structure:

- `row-blank` marks an empty row, which should be multiplied dynamically with reported data. It can be marked with `template` too to stay hidden when it's empty - it'll be removed.
- `row-header` marks an empty header row, which occupies all columns of the list and can be filled dynamically too. Used only in *feature list*.
- `body` marks the element which should be filled with cloned *row-blank*s or *row-header*s, as direct children. It is not necessary to be parent of *row-blank* (or *row-header*) when they stay empty, but it'll become their parent upon filling the data.

After we've discussed list declaration basics, we can move to main ToxTree elements:

- `<prefix>-features` marks the element which is the root of features list.
- `<prefix>-diagram` marks an image element that should be used to present the compound diagram.
- `<prefix>-models` marks the element which is the root of list of models. There are several sub-elements that may exist here, which are *not* prepended with prefix (they are searched as sub-elements of the root):
-- `auto` marks the checkbox which determines whether this model should be run automatically on each new query.
-- `run` marks the button that initiates the prediction, so that toxtree.js can attach on its `onclick` event.
-- `explanation` marks an element which will be filled with complete textual information, reported from the model on successful prediction.
-- `class-result` the root element for filling all reported classification classes - just like `body` class for lists.
-- `class-blank` a blank element for a classification class - to be filled up there.

These are all elements that participate in building the UI. Few of them can be provided during initialization, which is explained in the next chapter.

#### Initialization settings



Toxtree.js API
--------------

TODO:
-----
* style driven showing and hiding of results. 'predicted', 'high', ...
* tested on ... browsers;

* Use the query line as result messaging - be it with query description, be it with error
* POST requests to be finished;
* test on more browsers (includ. IE)
* Write help - some more in toxtree.js and more detailed here. Good description of elements.
