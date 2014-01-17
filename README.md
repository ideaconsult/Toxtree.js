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
- As **data-XXX** attributes of the inserting _div_. They follow the common *data-XXX* naming convention, i.e. `pollDelay` is referred with `data-poll-delay`. When (each) kit it automatically inserted (the default behaviour), these settings are merged with jToxKit's and are passed on kit's in
